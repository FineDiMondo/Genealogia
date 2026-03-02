#include "gn_menu.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

void gn_menu_init(GNMenu* m) {
    memset(m, 0, sizeof(*m));
    m->selected = 0;
}

void gn_menu_free(GNMenu* m) {
    if (!m) return;
    free(m->items);
    m->items = NULL;
    m->count = 0;
    m->selected = 0;
    m->pending_action[0] = 0;
}

static void parse_item(const char* s, char* label, size_t ln, char* action, size_t an) {
    label[0] = 0; action[0] = 0;
    if (!s) return;
    const char* bar = strchr(s, '|');
    if (!bar) {
        snprintf(label, ln, "%s", s);
        action[0] = 0;
        return;
    }
    size_t l = (size_t)(bar - s);
    if (l >= ln) l = ln - 1;
    memcpy(label, s, l);
    label[l] = 0;
    snprintf(action, an, "%s", bar + 1);
}

int gn_menu_load_from_ini(GNMenu* m, const GNIni* ini) {
    if (!m || !ini) return 0;

    // count items item1..item99
    int count = 0;
    for (int i = 1; i <= 99; i++) {
        char key[32];
        snprintf(key, sizeof(key), "item%d", i);
        const char* v = gn_ini_get(ini, "menu", key, NULL);
        if (!v || !v[0]) break;
        count++;
    }
    if (count <= 0) return 0;

    m->items = (GNMenuItem*)calloc((size_t)count, sizeof(GNMenuItem));
    if (!m->items) return 0;
    m->count = count;
    m->selected = 0;

    for (int i = 1; i <= count; i++) {
        char key[32];
        snprintf(key, sizeof(key), "item%d", i);
        const char* v = gn_ini_get(ini, "menu", key, "");
        parse_item(v, m->items[i-1].label, sizeof(m->items[i-1].label),
                      m->items[i-1].action, sizeof(m->items[i-1].action));
    }
    return 1;
}

int gn_menu_count(const GNMenu* m) { return m ? m->count : 0; }
int gn_menu_selected(const GNMenu* m) { return m ? m->selected : 0; }

const GNMenuItem* gn_menu_get(const GNMenu* m, int idx) {
    if (!m || idx < 0 || idx >= m->count) return NULL;
    return &m->items[idx];
}

void gn_menu_move(GNMenu* m, int delta) {
    if (!m || m->count <= 0) return;
    int x = m->selected + delta;
    if (x < 0) x = m->count - 1;
    if (x >= m->count) x = 0;
    m->selected = x;
}

void gn_menu_activate(GNMenu* m) {
    if (!m || m->count <= 0) return;
    const GNMenuItem* it = gn_menu_get(m, m->selected);
    if (!it) return;
    snprintf(m->pending_action, sizeof(m->pending_action), "%s", it->action);
}

const char* gn_menu_consume_action(GNMenu* m) {
    if (!m) return NULL;
    if (!m->pending_action[0]) return NULL;
    static char buf[128];
    snprintf(buf, sizeof(buf), "%s", m->pending_action);
    m->pending_action[0] = 0;
    return buf;
}
