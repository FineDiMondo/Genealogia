#pragma once
#include <SDL.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    int active;
    double phase;
    double freq;
    int samples_left;
    int total_samples;
    int gap_samples; // silence before start, used for chaining
} GNVoice;

typedef struct {
    int enabled;
    float volume;

    int crunch;
    int crunch_levels;
    float noise;

    int channels;
    int rate;
    int bits; // 8 or 16

    SDL_AudioDeviceID dev;
    SDL_AudioSpec spec;

    GNVoice voices[8];
    unsigned int rng; // for noise
} GNAudio;

int  gn_audio_init(GNAudio* a, int enabled, int bits, int rate, int channels, float volume,
                   int crunch, int crunch_levels, float noise, int jingle);
void gn_audio_shutdown(GNAudio* a);

void gn_audio_play_beep(GNAudio* a, double freq_hz, int ms, int gap_ms);
void gn_audio_play_move(GNAudio* a);
void gn_audio_play_select(GNAudio* a);
void gn_audio_play_cancel(GNAudio* a);
void gn_audio_play_start(GNAudio* a);

#ifdef __cplusplus
}
#endif
