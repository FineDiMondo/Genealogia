#pragma once
#include "gn_ini.h"

typedef struct {
    char label[128];
    char action[128];
} GNMenuItem;

typedef struct {
    GNMenuItem* items;
    int count;
    int selected;
    char pending_action[128];
} GNMenu;

void gn_menu_init(GNMenu* m);
void gn_menu_free(GNMenu* m);
int  gn_menu_load_from_ini(GNMenu* m, const GNIni* ini);

int  gn_menu_count(const GNMenu* m);
int  gn_menu_selected(const GNMenu* m);
const GNMenuItem* gn_menu_get(const GNMenu* m, int idx);

void gn_menu_move(GNMenu* m, int delta);
void gn_menu_activate(GNMenu* m);
const char* gn_menu_consume_action(GNMenu* m);
