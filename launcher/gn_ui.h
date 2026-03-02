#pragma once
#include <SDL.h>
#include <SDL_ttf.h>
#include "gn_menu.h"
#include "gn_session.h"

typedef struct {
    TTF_Font* font;
    int font_size;
    char font_path[512];
} GNUi;

int  gn_ui_init(GNUi* ui, const char* font_path, int font_size);
void gn_ui_shutdown(GNUi* ui);

void gn_ui_render(SDL_Renderer* ren, const GNUi* ui, const GNMenu* menu, const GNSession* session);
