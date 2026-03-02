#include "gn_audio.h"
#include <string.h>
#include <math.h>

static unsigned int xorshift32(unsigned int* s) {
    unsigned int x = *s;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *s = x;
    return x;
}

static float clampf(float x, float a, float b) {
    if (x < a) return a;
    if (x > b) return b;
    return x;
}

static float quantize(float x, int levels) {
    if (levels <= 1) return x;
    // x in [-1..1]
    float step = 2.0f / (float)(levels - 1);
    float q = (float)round((x + 1.0f) / step) * step - 1.0f;
    return clampf(q, -1.0f, 1.0f);
}

static float env_linear(int pos, int total, int attack, int release) {
    // simple attack/release envelope
    if (total <= 0) return 0.0f;
    if (pos < attack && attack > 0) return (float)pos / (float)attack;
    int remain = total - pos;
    if (remain < release && release > 0) return (float)remain / (float)release;
    return 1.0f;
}

static float square_osc(double* phase, double freq, int rate) {
    // square wave from phase accumulator
    double inc = (2.0 * M_PI * freq) / (double)rate;
    *phase += inc;
    if (*phase > 2.0 * M_PI) *phase -= 2.0 * M_PI;
    return (*phase < M_PI) ? 1.0f : -1.0f;
}

static void audio_cb(void* userdata, Uint8* stream, int len) {
    GNAudio* a = (GNAudio*)userdata;
    if (!a || !a->enabled) {
        memset(stream, 0, (size_t)len);
        return;
    }

    int bytes_per_sample = (a->spec.format == AUDIO_U8) ? 1 : 2; // mono
    int samples = len / bytes_per_sample;

    // output buffers
    if (a->spec.format == AUDIO_U8) {
        // center = 128
        for (int i = 0; i < samples; i++) {
            float mix = 0.0f;

            for (int v = 0; v < 8; v++) {
                GNVoice* vc = &a->voices[v];
                if (!vc->active) continue;

                if (vc->gap_samples > 0) {
                    vc->gap_samples--;
                    continue;
                }

                if (vc->samples_left <= 0) {
                    vc->active = 0;
                    continue;
                }

                int pos = vc->total_samples - vc->samples_left;
                // envelope anti-click
                int attack = (a->rate * 5) / 1000;   // 5ms
                int release = (a->rate * 10) / 1000; // 10ms
                float e = env_linear(pos, vc->total_samples, attack, release);

                float s = square_osc(&vc->phase, vc->freq, a->rate);
                mix += s * e;

                vc->samples_left--;
                if (vc->samples_left <= 0) vc->active = 0;
            }

            // noise
            if (a->noise > 0.0f) {
                unsigned int r = xorshift32(&a->rng);
                float n = ((r & 0xFFFF) / 32768.0f) - 1.0f;
                mix += n * a->noise;
            }

            // scale
            mix *= a->volume;
            mix = clampf(mix, -1.0f, 1.0f);

            // crunchy quantization
            if (a->crunch) mix = quantize(mix, a->crunch_levels);

            Uint8 out = (Uint8)(128 + (int)(mix * 127.0f));
            stream[i] = out;
        }
    } else {
        // AUDIO_S16SYS
        Sint16* out = (Sint16*)stream;
        int samples16 = len / (int)sizeof(Sint16);
        for (int i = 0; i < samples16; i++) {
            float mix = 0.0f;

            for (int v = 0; v < 8; v++) {
                GNVoice* vc = &a->voices[v];
                if (!vc->active) continue;

                if (vc->gap_samples > 0) {
                    vc->gap_samples--;
                    continue;
                }

                if (vc->samples_left <= 0) {
                    vc->active = 0;
                    continue;
                }

                int pos = vc->total_samples - vc->samples_left;
                int attack = (a->rate * 5) / 1000;
                int release = (a->rate * 10) / 1000;
                float e = env_linear(pos, vc->total_samples, attack, release);

                float s = square_osc(&vc->phase, vc->freq, a->rate);
                mix += s * e;

                vc->samples_left--;
                if (vc->samples_left <= 0) vc->active = 0;
            }

            if (a->noise > 0.0f) {
                unsigned int r = xorshift32(&a->rng);
                float n = ((r & 0xFFFF) / 32768.0f) - 1.0f;
                mix += n * a->noise;
            }

            mix *= a->volume;
            mix = clampf(mix, -1.0f, 1.0f);

            if (a->crunch) mix = quantize(mix, a->crunch_levels);

            int v = (int)(mix * 32767.0f);
            if (v < -32768) v = -32768;
            if (v > 32767) v = 32767;
            out[i] = (Sint16)v;
        }
    }
}

static void clear_voices(GNAudio* a) {
    for (int i=0; i<8; i++) {
        a->voices[i].active = 0;
        a->voices[i].phase = 0.0;
        a->voices[i].freq = 0.0;
        a->voices[i].samples_left = 0;
        a->voices[i].total_samples = 0;
        a->voices[i].gap_samples = 0;
    }
}

static void alloc_voice(GNAudio* a, double freq, int ms, int gap_ms) {
    if (!a || !a->enabled) return;
    int total = (a->rate * ms) / 1000;
    int gap = (a->rate * gap_ms) / 1000;
    if (total <= 0) total = 1;

    for (int i=0; i<8; i++) {
        if (!a->voices[i].active) {
            a->voices[i].active = 1;
            a->voices[i].phase = 0.0;
            a->voices[i].freq = freq;
            a->voices[i].samples_left = total;
            a->voices[i].total_samples = total;
            a->voices[i].gap_samples = gap;
            return;
        }
    }
    // if all busy, steal voice 0
    a->voices[0].active = 1;
    a->voices[0].phase = 0.0;
    a->voices[0].freq = freq;
    a->voices[0].samples_left = total;
    a->voices[0].total_samples = total;
    a->voices[0].gap_samples = gap;
}

int gn_audio_init(GNAudio* a, int enabled, int bits, int rate, int channels, float volume,
                  int crunch, int crunch_levels, float noise, int jingle) {
    if (!a) return 0;
    memset(a, 0, sizeof(*a));
    a->enabled = enabled ? 1 : 0;
    a->bits = (bits == 8) ? 8 : 16;
    a->rate = (rate > 0) ? rate : 22050;
    a->channels = (channels == 2) ? 2 : 1; // keep mono default
    a->volume = clampf(volume, 0.0f, 1.0f);
    a->crunch = crunch ? 1 : 0;
    a->crunch_levels = (crunch_levels >= 4) ? crunch_levels : 16;
    a->noise = clampf(noise, 0.0f, 0.2f);
    a->rng = 0xC0FFEEu;

    if (!a->enabled) return 1;

    SDL_AudioSpec want;
    SDL_zero(want);
    want.freq = a->rate;
    want.channels = (Uint8)a->channels;
    want.samples = 1024;
    want.callback = audio_cb;
    want.userdata = a;
    want.format = (a->bits == 8) ? AUDIO_U8 : AUDIO_S16SYS;

    a->dev = SDL_OpenAudioDevice(NULL, 0, &want, &a->spec, 0);
    if (a->dev == 0) {
        a->enabled = 0;
        return 0;
    }

    clear_voices(a);
    SDL_PauseAudioDevice(a->dev, 0);

    if (jingle) {
        // play small jingle
        gn_audio_play_start(a);
    }
    return 1;
}

void gn_audio_shutdown(GNAudio* a) {
    if (!a) return;
    if (a->dev) {
        SDL_CloseAudioDevice(a->dev);
        a->dev = 0;
    }
    a->enabled = 0;
}

void gn_audio_play_beep(GNAudio* a, double freq_hz, int ms, int gap_ms) {
    if (!a || !a->enabled || !a->dev) return;
    SDL_LockAudioDevice(a->dev);
    alloc_voice(a, freq_hz, ms, gap_ms);
    SDL_UnlockAudioDevice(a->dev);
}

void gn_audio_play_move(GNAudio* a) {
    gn_audio_play_beep(a, 880.0, 60, 0);
}

void gn_audio_play_select(GNAudio* a) {
    // two-tone select
    gn_audio_play_beep(a, 660.0, 60, 0);
    gn_audio_play_beep(a, 990.0, 60, 80); // 20ms gap approximated by 80ms from start (first 60ms + 20ms)
}

void gn_audio_play_cancel(GNAudio* a) {
    gn_audio_play_beep(a, 220.0, 120, 0);
}

void gn_audio_play_start(GNAudio* a) {
    // SCUMM-ish jingle: short ascending pattern
    // timings intentionally short
    int t = 70;
    int gap = 0;
    gn_audio_play_beep(a, 440.0, t, gap);
    gn_audio_play_beep(a, 523.25, t, 90);
    gn_audio_play_beep(a, 659.25, t, 180);
    gn_audio_play_beep(a, 880.0, t, 270);
    gn_audio_play_beep(a, 659.25, t, 360);
    gn_audio_play_beep(a, 523.25, t, 450);
}
