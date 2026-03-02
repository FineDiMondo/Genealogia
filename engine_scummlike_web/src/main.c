#include <SDL.h>
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

typedef enum { VERB_LOOK = 0, VERB_TALK = 1, VERB_USE = 2 } Verb;

typedef struct AppState {
    SDL_Window *win;
    SDL_Renderer *ren;
    int w;
    int h;
    int running;
    Verb verb;
    const char *verb_name;
    const char *status_text;
    SDL_Rect verb_bar;
    SDL_Rect btn_look;
    SDL_Rect btn_talk;
    SDL_Rect btn_use;
    SDL_Rect hotspot;
} AppState;

static AppState g_app;

static void draw_rect(SDL_Renderer *r, int x, int y, int w, int h, Uint8 rr, Uint8 gg, Uint8 bb) {
    SDL_Rect rc = {x, y, w, h};
    SDL_SetRenderDrawColor(r, rr, gg, bb, 255);
    SDL_RenderFillRect(r, &rc);
}

static int hit(int mx, int my, SDL_Rect rc) {
    return (mx >= rc.x && mx < rc.x + rc.w && my >= rc.y && my < rc.y + rc.h);
}

static void set_verb(AppState *app, Verb verb) {
    app->verb = verb;
    if (verb == VERB_LOOK) {
        app->verb_name = "LOOK";
    } else if (verb == VERB_TALK) {
        app->verb_name = "TALK";
    } else {
        app->verb_name = "USE";
    }
}

static void apply_hotspot_action(AppState *app) {
    if (app->verb == VERB_LOOK) {
        app->status_text = "You look at the object.";
    } else if (app->verb == VERB_TALK) {
        app->status_text = "It does not respond.";
    } else {
        app->status_text = "You try to use it. Nothing happens.";
    }
}

static void handle_pointer(AppState *app, int mx, int my) {
    if (hit(mx, my, app->btn_look)) {
        set_verb(app, VERB_LOOK);
        app->status_text = "Verb set to LOOK";
    } else if (hit(mx, my, app->btn_talk)) {
        set_verb(app, VERB_TALK);
        app->status_text = "Verb set to TALK";
    } else if (hit(mx, my, app->btn_use)) {
        set_verb(app, VERB_USE);
        app->status_text = "Verb set to USE";
    } else if (hit(mx, my, app->hotspot)) {
        apply_hotspot_action(app);
    }
}

static void handle_events(AppState *app) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
        if (e.type == SDL_QUIT) {
            app->running = 0;
        }

        if (e.type == SDL_KEYDOWN) {
            switch (e.key.keysym.sym) {
                case SDLK_ESCAPE:
                    app->running = 0;
                    break;
                case SDLK_1:
                    set_verb(app, VERB_LOOK);
                    app->status_text = "Verb set to LOOK";
                    break;
                case SDLK_2:
                    set_verb(app, VERB_TALK);
                    app->status_text = "Verb set to TALK";
                    break;
                case SDLK_3:
                    set_verb(app, VERB_USE);
                    app->status_text = "Verb set to USE";
                    break;
                default:
                    break;
            }
        }

        if (e.type == SDL_MOUSEBUTTONDOWN && e.button.button == SDL_BUTTON_LEFT) {
            handle_pointer(app, e.button.x, e.button.y);
        }

        if (e.type == SDL_FINGERDOWN) {
            int mx = (int)(e.tfinger.x * (float)app->w);
            int my = (int)(e.tfinger.y * (float)app->h);
            handle_pointer(app, mx, my);
        }

        if (e.type == SDL_CONTROLLERBUTTONDOWN) {
            if (e.cbutton.button == SDL_CONTROLLER_BUTTON_B) {
                app->running = 0;
            }
            if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_LEFT) {
                set_verb(app, VERB_LOOK);
                app->status_text = "Verb set to LOOK";
            }
            if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_UP) {
                set_verb(app, VERB_TALK);
                app->status_text = "Verb set to TALK";
            }
            if (e.cbutton.button == SDL_CONTROLLER_BUTTON_DPAD_RIGHT) {
                set_verb(app, VERB_USE);
                app->status_text = "Verb set to USE";
            }
            if (e.cbutton.button == SDL_CONTROLLER_BUTTON_A) {
                apply_hotspot_action(app);
            }
        }
    }
}

static void render(AppState *app) {
    SDL_SetRenderDrawColor(app->ren, 20, 20, 26, 255);
    SDL_RenderClear(app->ren);

    draw_rect(app->ren, 0, 0, app->w, app->h - 110, 30, 30, 40);

    if (app->verb == VERB_LOOK) {
        draw_rect(app->ren, app->hotspot.x, app->hotspot.y, app->hotspot.w, app->hotspot.h, 70, 95, 120);
    } else if (app->verb == VERB_TALK) {
        draw_rect(app->ren, app->hotspot.x, app->hotspot.y, app->hotspot.w, app->hotspot.h, 95, 70, 120);
    } else {
        draw_rect(app->ren, app->hotspot.x, app->hotspot.y, app->hotspot.w, app->hotspot.h, 120, 95, 70);
    }

    draw_rect(app->ren, app->verb_bar.x, app->verb_bar.y, app->verb_bar.w, app->verb_bar.h, 15, 15, 18);
    draw_rect(
        app->ren,
        app->btn_look.x,
        app->btn_look.y,
        app->btn_look.w,
        app->btn_look.h,
        (app->verb == VERB_LOOK) ? 120 : 60,
        (app->verb == VERB_LOOK) ? 120 : 60,
        (app->verb == VERB_LOOK) ? 140 : 80
    );
    draw_rect(
        app->ren,
        app->btn_talk.x,
        app->btn_talk.y,
        app->btn_talk.w,
        app->btn_talk.h,
        (app->verb == VERB_TALK) ? 120 : 60,
        (app->verb == VERB_TALK) ? 120 : 60,
        (app->verb == VERB_TALK) ? 140 : 80
    );
    draw_rect(
        app->ren,
        app->btn_use.x,
        app->btn_use.y,
        app->btn_use.w,
        app->btn_use.h,
        (app->verb == VERB_USE) ? 120 : 60,
        (app->verb == VERB_USE) ? 120 : 60,
        (app->verb == VERB_USE) ? 140 : 80
    );

    {
        char title[256];
        snprintf(
            title,
            sizeof(title),
            "SCUMM-like Web | Verb:%s | Status:%s | Keys 1/2/3, ESC",
            app->verb_name,
            app->status_text
        );
        SDL_SetWindowTitle(app->win, title);
    }

    SDL_RenderPresent(app->ren);
}

static void frame(void) {
    if (!g_app.running) {
#ifdef __EMSCRIPTEN__
        emscripten_cancel_main_loop();
#endif
        return;
    }
    handle_events(&g_app);
    render(&g_app);
}

int main(int argc, char **argv) {
    (void)argc;
    (void)argv;

    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMECONTROLLER | SDL_INIT_AUDIO) != 0) {
        fprintf(stderr, "SDL_Init error: %s\n", SDL_GetError());
        return 1;
    }

    g_app.w = 960;
    g_app.h = 540;
    g_app.running = 1;
    set_verb(&g_app, VERB_LOOK);
    g_app.status_text = "Ready";

    g_app.win = SDL_CreateWindow(
        "SCUMM-like Web",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        g_app.w,
        g_app.h,
        SDL_WINDOW_SHOWN
    );
    if (!g_app.win) {
        fprintf(stderr, "SDL_CreateWindow error: %s\n", SDL_GetError());
        SDL_Quit();
        return 1;
    }

    g_app.ren = SDL_CreateRenderer(g_app.win, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!g_app.ren) {
        g_app.ren = SDL_CreateRenderer(g_app.win, -1, SDL_RENDERER_SOFTWARE);
    }
    if (!g_app.ren) {
        fprintf(stderr, "SDL_CreateRenderer error: %s\n", SDL_GetError());
        SDL_DestroyWindow(g_app.win);
        SDL_Quit();
        return 1;
    }

    g_app.verb_bar = (SDL_Rect){0, g_app.h - 110, g_app.w, 110};
    g_app.btn_look = (SDL_Rect){20, g_app.h - 90, 120, 60};
    g_app.btn_talk = (SDL_Rect){160, g_app.h - 90, 120, 60};
    g_app.btn_use = (SDL_Rect){300, g_app.h - 90, 120, 60};
    g_app.hotspot = (SDL_Rect){g_app.w / 2 - 70, g_app.h / 2 - 90, 140, 140};

#ifdef __EMSCRIPTEN__
    emscripten_set_main_loop(frame, 0, 1);
#else
    while (g_app.running) {
        frame();
        SDL_Delay(1);
    }
#endif

    SDL_DestroyRenderer(g_app.ren);
    SDL_DestroyWindow(g_app.win);
    SDL_Quit();
    return 0;
}
