Audio -> MIDI (FFT) toolchain

Dipendenze:
- gfortran in PATH (es. MSYS2/MinGW-w64 o LLVM flang se compatibile)
- flac.exe oppure ffmpeg.exe in PATH

Uso rapido:
1) tools\audio\wav2midi.cmd input.flac tools\audio\out\output.mid 120
   oppure:
   tools\audio\wav2midi.cmd input.wav tools\audio\out\output.mid 120

Uso senza argomenti:
- tools\audio\wav2midi.cmd
  apre una finestra di selezione file (FLAC/WAV).

Note:
- Il tool è monofonico e retro: estrae il pitch dominante con STFT/FFT e crea un MIDI Type 0.
- WAV supportato: PCM 16-bit mono.
- Per risultati migliori: linee melodiche semplici, poco rumore, poca polifonia.
