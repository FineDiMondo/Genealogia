#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <SDL.h>

#include "gn_ini.h"
#include "gn_log.h"
#include "gn_session.h"
#include "gn_menu.h"
#include "gn_audio.h"
#include "gn_ui.h"

static int set_env_kv(const char* key, const char* value) {
#ifdef _WIN32
    return _putenv_s(key, value);
#else
    return setenv(key, value, 1);
#endif
}

static int run_command(const char* label, const char* cmd, const char* log_path) {
    if (log_path) gn_log_appendf(log_path, "\n=== RUN: %s ===\nCMD: %s\n", label, cmd);
    int rc = system(cmd);
    if (log_path) gn_log_appendf(log_path, "RC=%d\n", rc);
    return rc;
}

static void ensure_session(GNSession* session, const char* runtime_dir, const char* repo_root) {
    if (gn_session_is_open(session)) return;
    if (gn_session_open(session, runtime_dir) == 0) {
        set_env_kv("GN_SESSION_DIR", session->session_dir);
        set_env_kv("GN_DB", session->db_path);
        set_env_kv("GN_LOG", session->log_path);
        set_env_kv("GN_REPO_ROOT", repo_root);
    }
}

int main(int argc, char** argv) {
    (void)argc; (void)argv;

    GNIni ini;
    if (!gn_ini_load(&ini, "launcher.ini")) {
        printf("ERROR: launcher.ini not found.\n");
        return 3;
    }

    const char* repo_root = gn_ini_get(&ini, "paths", "repo_root", "..");
    const char* runtime_dir = gn_ini_get(&ini, "paths", "runtime_dir", "../runtime");
    const char* font_path = gn_ini_get(&ini, "assets", "font", "assets/DejaVuSansMono.ttf");
    int font_size = gn_ini_get_int(&ini, "assets", "font_size", 18);
    int audio_enabled = gn_ini_get_int(&ini, "audio", "enabled", 1);
    int audio_bits = gn_ini_get_int(&ini, "audio", "bits", 16);
    int audio_rate = gn_ini_get_int(&ini, "audio", "rate", 22050);
    int audio_channels = gn_ini_get_int(&ini, "audio", "channels", 1);
    float audio_volume = (float)atof(gn_ini_get(&ini, "audio", "volume", "0.25"));
    int audio_crunch = gn_ini_get_int(&ini, "audio", "crunch", 1);
    int audio_levels = gn_ini_get_int(&ini, "audio", "crunch_levels", 16);
    float audio_noise = (float)atof(gn_ini_get(&ini, "audio", "noise", "0.02"));
    int audio_jingle = gn_ini_get_int(&ini, "audio", "jingle", 1);

    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_EVENTS | SDL_INIT_AUDIO) != 0) {
        printf("SDL_Init failed: %s\n", SDL_GetError());
        gn_ini_free(&ini);
        return 3;
    }

    SDL_Window* win = SDL_CreateWindow("GNLauncher", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 900, 520, SDL_WINDOW_SHOWN);
    if (!win) { printf("SDL_CreateWindow failed: %s\n", SDL_GetError()); SDL_Quit(); gn_ini_free(&ini); return 3; }

    SDL_Renderer* ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!ren) { printf("SDL_CreateRenderer failed: %s\n", SDL_GetError()); SDL_DestroyWindow(win); SDL_Quit(); gn_ini_free(&ini); return 3; }

    // controller
    SDL_GameController* pad = NULL;
    for (int i = 0; i < SDL_NumJoysticks(); i++) {
        if (SDL_IsGameController(i)) { pad = SDL_GameControllerOpen(i); break; }
    }

    GNUi ui;
    if (!gn_ui_init(&ui, font_path, font_size)) {
        printf("ERROR: SDL_ttf init failed or font not found: %s\n", font_path);
        if (pad) SDL_GameControllerClose(pad);
        SDL_DestroyRenderer(ren);
        SDL_DestroyWindow(win);
        SDL_Quit();
        gn_ini_free(&ini);
        return 3;
    }

    GNAudio audio;
    if (!gn_audio_init(&audio, audio_enabled, audio_bits, audio_rate, audio_channels, audio_volume,
                       audio_crunch, audio_levels, audio_noise, audio_jingle)) {
        printf("ERROR: audio init failed (enabled=%d bits=%d rate=%d channels=%d)\n",
               audio_enabled, audio_bits, audio_rate, audio_channels);
    }

    GNMenu menu;
    gn_menu_init(&menu);
    if (!gn_menu_load_from_ini(&menu, &ini)) {
        printf("ERROR: menu not loaded from launcher.ini\n");
        gn_ui_shutdown(&ui);
        if (pad) SDL_GameControllerClose(pad);
        SDL_DestroyRenderer(ren);
        SDL_DestroyWindow(win);
        SDL_Quit();
        gn_ini_free(&ini);
        return 3;
    }

    GNSession session;
    gn_session_init(&session);

    int running = 1;
    while (running) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) running = 0;

            if (e.type == SDL_KEYDOWN) {
                switch (e.key.keysym.sym) {
                    case SDLK_UP:
                        gn_menu_move(&menu, -1);
                        gn_audio_play_move(&audio);
                        break;
                    case SDLK_DOWN:
                        gn_menu_move(&menu, +1);
                        gn_audio_play_move(&audio);
                        break;
                    case SDLK_RETURN:
                        gn_menu_activate(&menu);
                        gn_audio_play_select(&audio);
                        break;
                    case SDLK_ESCAPE:
                        gn_audio_play_cancel(&audio);
                        running = 0;
                        break;
                    default: break;
                }
            }

            if (e.type == SDL_CONTROLLERBUTTONDOWN) {
                switch (e.cbutton.button) {
                    case SDL_CONTROLLER_BUTTON_DPAD_UP:
                        gn_menu_move(&menu, -1);
                        gn_audio_play_move(&audio);
                        break;
                    case SDL_CONTROLLER_BUTTON_DPAD_DOWN:
                        gn_menu_move(&menu, +1);
                        gn_audio_play_move(&audio);
                        break;
                    case SDL_CONTROLLER_BUTTON_A:
                        gn_menu_activate(&menu);
                        gn_audio_play_select(&audio);
                        break;
                    case SDL_CONTROLLER_BUTTON_START:
                        // set action directly by injecting pending_action
                        snprintf(menu.pending_action, sizeof(menu.pending_action), "full_pipeline");
                        gn_audio_play_start(&audio);
                        break;
                    case SDL_CONTROLLER_BUTTON_B:
                        // optional back behavior; keep as no-op now
                        gn_audio_play_cancel(&audio);
                        break;
                    default: break;
                }
            }
        }

        const char* action = gn_menu_consume_action(&menu);
        if (action && action[0]) {
            if (strcmp(action, "exit") == 0) {
                gn_audio_play_cancel(&audio);
                running = 0;
            } else if (strcmp(action, "session_open") == 0) {
                ensure_session(&session, runtime_dir, repo_root);
            } else if (strcmp(action, "session_close") == 0) {
                gn_session_close(&session);
            } else if (strcmp(action, "session_snapshot") == 0) {
                if (!gn_session_is_open(&session)) ensure_session(&session, runtime_dir, repo_root);
                gn_session_snapshot(&session, runtime_dir);
            } else if (strcmp(action, "full_pipeline") == 0) {
                ensure_session(&session, runtime_dir, repo_root);
                const char* seq[] = {"import_gedcom","validate","build","publish",NULL};
                for (int i=0; seq[i]; i++) {
                    const char* cmd = gn_ini_get(&ini, "commands", seq[i], "");
                    if (cmd && cmd[0]) run_command(seq[i], cmd, session.log_path);
                }
            } else if (strncmp(action, "run:", 4) == 0) {
                ensure_session(&session, runtime_dir, repo_root);
                const char* key = action + 4;
                const char* cmd = gn_ini_get(&ini, "commands", key, "");
                if (cmd && cmd[0]) run_command(key, cmd, session.log_path);
                else gn_log_appendf(session.log_path, "WARN missing command: %s\n", key);
            } else {
                if (gn_session_is_open(&session)) gn_log_appendf(session.log_path, "WARN unknown action: %s\n", action);
                gn_audio_play_cancel(&audio);
            }
        }

        gn_ui_render(ren, &ui, &menu, &session);
        SDL_Delay(8);
    }

    gn_session_close(&session);
    gn_menu_free(&menu);
    gn_audio_shutdown(&audio);
    gn_ui_shutdown(&ui);

    if (pad) SDL_GameControllerClose(pad);
    SDL_DestroyRenderer(ren);
    SDL_DestroyWindow(win);
    SDL_Quit();
    gn_ini_free(&ini);
    return 0;
}
