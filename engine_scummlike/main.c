#include <SDL.h>
#include <stdio.h>

typedef enum { VERB_LOOK = 0, VERB_TALK = 1, VERB_USE = 2 } Verb;

static void draw_rect(SDL_Renderer *r, int x, int y, int w, int h, Uint8 rr, Uint8 gg, Uint8 bb) {
    SDL_Rect rc = {x, y, w, h};
    SDL_SetRenderDrawColor(r, rr, gg, bb, 255);
    SDL_RenderFillRect(r, &rc);
}

static int hit(int mx, int my, SDL_Rect rc) {
    return (mx >= rc.x && mx < rc.x + rc.w && my >= rc.y && my < rc.y + rc.h);
}

int main(int argc, char **argv) {
    (void)argc;
    (void)argv;

    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_AUDIO) != 0) {
        fprintf(stderr, "SDL_Init error: %s\n", SDL_GetError());
        return 1;
    }

    const int w = 960;
    const int h = 540;

    SDL_Window *win = SDL_CreateWindow(
        "SCUMM-like Engine (C/SDL2)",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        w,
        h,
        SDL_WINDOW_SHOWN
    );
    if (!win) {
        fprintf(stderr, "SDL_CreateWindow error: %s\n", SDL_GetError());
        SDL_Quit();
        return 1;
    }

    SDL_Renderer *ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!ren) {
        fprintf(stderr, "SDL_CreateRenderer error: %s\n", SDL_GetError());
        SDL_DestroyWindow(win);
        SDL_Quit();
        return 1;
    }

    SDL_Rect verb_bar = {0, h - 110, w, 110};
    SDL_Rect btn_look = {20, h - 90, 120, 60};
    SDL_Rect btn_talk = {160, h - 90, 120, 60};
    SDL_Rect btn_use = {300, h - 90, 120, 60};

    SDL_Rect hotspot = {w / 2 - 70, h / 2 - 90, 140, 140};

    Verb verb = VERB_LOOK;
    const char *verb_name = "LOOK";

    int running = 1;
    while (running) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) {
                running = 0;
            }

            if (e.type == SDL_KEYDOWN) {
                switch (e.key.keysym.sym) {
                    case SDLK_ESCAPE:
                        running = 0;
                        break;
                    case SDLK_1:
                        verb = VERB_LOOK;
                        verb_name = "LOOK";
                        break;
                    case SDLK_2:
                        verb = VERB_TALK;
                        verb_name = "TALK";
                        break;
                    case SDLK_3:
                        verb = VERB_USE;
                        verb_name = "USE";
                        break;
                    default:
                        break;
                }
            }

            if (e.type == SDL_MOUSEBUTTONDOWN && e.button.button == SDL_BUTTON_LEFT) {
                int mx = e.button.x;
                int my = e.button.y;

                if (hit(mx, my, btn_look)) {
                    verb = VERB_LOOK;
                    verb_name = "LOOK";
                } else if (hit(mx, my, btn_talk)) {
                    verb = VERB_TALK;
                    verb_name = "TALK";
                } else if (hit(mx, my, btn_use)) {
                    verb = VERB_USE;
                    verb_name = "USE";
                } else if (hit(mx, my, hotspot)) {
                    if (verb == VERB_LOOK) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "LOOK", "You look at the object.", win);
                    }
                    if (verb == VERB_TALK) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "TALK", "It doesn't respond.", win);
                    }
                    if (verb == VERB_USE) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "USE", "You try to use it. Nothing happens.", win);
                    }
                }
            }

            if (e.type == SDL_CONTROLLERBUTTONDOWN) {
                if (e.cbutton.button == SDL_CONTROLLER_BUTTON_B) {
                    running = 0;
                }
                if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_LEFT) {
                    verb = VERB_LOOK;
                    verb_name = "LOOK";
                }
                if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_UP) {
                    verb = VERB_TALK;
                    verb_name = "TALK";
                }
                if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_RIGHT) {
                    verb = VERB_USE;
                    verb_name = "USE";
                }
                if (e.cbutton.button == SDL_CONTROLLER_BUTTON_A) {
                    if (verb == VERB_LOOK) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "LOOK", "You look at the object.", win);
                    }
                    if (verb == VERB_TALK) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "TALK", "It doesn't respond.", win);
                    }
                    if (verb == VERB_USE) {
                        SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "USE", "You try to use it. Nothing happens.", win);
                    }
                }
            }
        }

        SDL_SetRenderDrawColor(ren, 20, 20, 26, 255);
        SDL_RenderClear(ren);

        draw_rect(ren, 0, 0, w, h - 110, 30, 30, 40);
        draw_rect(ren, hotspot.x, hotspot.y, hotspot.w, hotspot.h, 70, 70, 95);
        draw_rect(ren, verb_bar.x, verb_bar.y, verb_bar.w, verb_bar.h, 15, 15, 18);

        draw_rect(
            ren,
            btn_look.x,
            btn_look.y,
            btn_look.w,
            btn_look.h,
            (verb == VERB_LOOK) ? 120 : 60,
            (verb == VERB_LOOK) ? 120 : 60,
            (verb == VERB_LOOK) ? 140 : 80
        );
        draw_rect(
            ren,
            btn_talk.x,
            btn_talk.y,
            btn_talk.w,
            btn_talk.h,
            (verb == VERB_TALK) ? 120 : 60,
            (verb == VERB_TALK) ? 120 : 60,
            (verb == VERB_TALK) ? 140 : 80
        );
        draw_rect(
            ren,
            btn_use.x,
            btn_use.y,
            btn_use.w,
            btn_use.h,
            (verb == VERB_USE) ? 120 : 60,
            (verb == VERB_USE) ? 120 : 60,
            (verb == VERB_USE) ? 140 : 80
        );

        {
            char title[128];
            snprintf(title, sizeof(title), "SCUMM-like | Verb: %s | Keys: 1/2/3 | Click hotspot", verb_name);
            SDL_SetWindowTitle(win, title);
        }

        SDL_RenderPresent(ren);
    }

    SDL_DestroyRenderer(ren);
    SDL_DestroyWindow(win);
    SDL_Quit();
    return 0;
}
