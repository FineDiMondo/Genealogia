#include "gn_ui.h"
#include <string.h>
#include <stdio.h>

static void draw_text(SDL_Renderer* ren, TTF_Font* font, int x, int y, const char* text) {
    if (!text || !text[0]) return;
    SDL_Color fg = { 230, 230, 230, 255 };
    SDL_Surface* s = TTF_RenderUTF8_Blended(font, text, fg);
    if (!s) return;
    SDL_Texture* t = SDL_CreateTextureFromSurface(ren, s);
    if (!t) { SDL_FreeSurface(s); return; }
    SDL_Rect r = { x, y, s->w, s->h };
    SDL_RenderCopy(ren, t, NULL, &r);
    SDL_DestroyTexture(t);
    SDL_FreeSurface(s);
}

int gn_ui_init(GNUi* ui, const char* font_path, int font_size) {
    if (!ui) return 0;
    memset(ui, 0, sizeof(*ui));
    ui->font_size = font_size > 0 ? font_size : 18;
    if (font_path) snprintf(ui->font_path, sizeof(ui->font_path), "%s", font_path);

    if (TTF_Init() != 0) return 0;
    ui->font = TTF_OpenFont(ui->font_path, ui->font_size);
    return ui->font != NULL;
}

void gn_ui_shutdown(GNUi* ui) {
    if (!ui) return;
    if (ui->font) TTF_CloseFont(ui->font);
    ui->font = NULL;
    TTF_Quit();
}

void gn_ui_render(SDL_Renderer* ren, const GNUi* ui, const GNMenu* menu, const GNSession* session) {
    if (!ren || !ui || !ui->font || !menu) return;

    // background
    SDL_SetRenderDrawColor(ren, 18, 18, 18, 255);
    SDL_RenderClear(ren);

    // header
    draw_text(ren, ui->font, 40, 25, "GNLauncher - Session Orchestrator (SDL2 + SQLite)");
    char st[512];
    if (session && session->is_open) {
        snprintf(st, sizeof(st), "SESSION: OPEN   DB: %s", session->db_path);
    } else {
        snprintf(st, sizeof(st), "SESSION: CLOSED   (Apri sessione o lancia un comando per auto-open)");
    }
    draw_text(ren, ui->font, 40, 55, st);

    // menu
    int y0 = 110;
    for (int i = 0; i < gn_menu_count(menu); i++) {
        SDL_Rect box = { 40, y0 + i*40, 820, 32 };
        if (i == gn_menu_selected(menu)) SDL_SetRenderDrawColor(ren, 70, 70, 70, 255);
        else SDL_SetRenderDrawColor(ren, 40, 40, 40, 255);
        SDL_RenderFillRect(ren, &box);

        const GNMenuItem* it = gn_menu_get(menu, i);
        if (it) draw_text(ren, ui->font, 55, y0 + i*40 + 6, it->label);
    }

    // footer
    draw_text(ren, ui->font, 40, 470, "Keyboard: UP/DOWN, ENTER, ESC | Gamepad: D-Pad, A=Select, Start=Full Pipeline");
    SDL_RenderPresent(ren);
}
