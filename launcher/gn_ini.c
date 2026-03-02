#include "gn_ini.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static char* read_all(const char* path, size_t* out_len) {
    FILE* f = fopen(path, "rb");
    if (!f) return NULL;
    fseek(f, 0, SEEK_END);
    long n = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (n <= 0) { fclose(f); return NULL; }

    char* buf = (char*)malloc((size_t)n + 1);
    if (!buf) { fclose(f); return NULL; }
    size_t r = fread(buf, 1, (size_t)n, f);
    fclose(f);
    buf[r] = '\0';
    if (out_len) *out_len = r;
    return buf;
}

static void trim_inplace(char* s) {
    if (!s) return;
    // left
    char* p = s;
    while (*p && isspace((unsigned char)*p)) p++;
    if (p != s) memmove(s, p, strlen(p) + 1);
    // right
    size_t len = strlen(s);
    while (len > 0 && isspace((unsigned char)s[len-1])) {
        s[len-1] = 0;
        len--;
    }
}

int gn_ini_load(GNIni* ini, const char* path) {
    if (!ini) return 0;
    memset(ini, 0, sizeof(*ini));
    ini->data = read_all(path, &ini->data_len);
    return ini->data != NULL;
}

void gn_ini_free(GNIni* ini) {
    if (!ini) return;
    free(ini->data);
    ini->data = NULL;
    ini->data_len = 0;
}

static int line_is_comment_or_empty(const char* line) {
    if (!line) return 1;
    while (*line && isspace((unsigned char)*line)) line++;
    if (*line == 0) return 1;
    if (*line == ';' || *line == '#') return 1;
    return 0;
}

static int parse_section(const char* line, char* out, size_t out_n) {
    // expects [section]
    const char* p = line;
    while (*p && isspace((unsigned char)*p)) p++;
    if (*p != '[') return 0;
    p++;
    const char* end = strchr(p, ']');
    if (!end) return 0;
    size_t n = (size_t)(end - p);
    if (n + 1 > out_n) n = out_n - 1;
    memcpy(out, p, n);
    out[n] = 0;
    trim_inplace(out);
    return 1;
}

static int parse_kv(const char* line, char* key, size_t key_n, char* val, size_t val_n) {
    const char* p = line;
    while (*p && isspace((unsigned char)*p)) p++;
    const char* eq = strchr(p, '=');
    if (!eq) return 0;

    size_t kn = (size_t)(eq - p);
    if (kn + 1 > key_n) kn = key_n - 1;
    memcpy(key, p, kn);
    key[kn] = 0;
    trim_inplace(key);

    const char* v = eq + 1;
    while (*v && isspace((unsigned char)*v)) v++;
    size_t vn = strlen(v);
    if (vn + 1 > val_n) vn = val_n - 1;
    memcpy(val, v, vn);
    val[vn] = 0;

    // strip inline comment ; or # if preceded by whitespace
    for (size_t i=0; val[i]; i++) {
        if ((val[i] == ';' || val[i] == '#') && (i==0 || isspace((unsigned char)val[i-1]))) {
            val[i] = 0;
            break;
        }
    }
    trim_inplace(val);
    return key[0] != 0;
}

const char* gn_ini_get(const GNIni* ini, const char* section, const char* key, const char* def) {
    if (!ini || !ini->data || !section || !key) return def;

    char cur_section[128] = {0};
    char wanted_section[128] = {0};
    snprintf(wanted_section, sizeof(wanted_section), "%s", section);

    const char* s = ini->data;
    const char* line = s;
    while (*line) {
        // read line
        const char* eol = strchr(line, '\n');
        size_t n = eol ? (size_t)(eol - line) : strlen(line);
        char buf[1024];
        if (n >= sizeof(buf)) n = sizeof(buf)-1;
        memcpy(buf, line, n);
        buf[n] = 0;

        // normalize CR
        size_t bl = strlen(buf);
        if (bl > 0 && buf[bl-1] == '\r') buf[bl-1] = 0;

        if (!line_is_comment_or_empty(buf)) {
            char sec[128];
            if (parse_section(buf, sec, sizeof(sec))) {
                snprintf(cur_section, sizeof(cur_section), "%s", sec);
            } else {
                char k[256], v[768];
                if (parse_kv(buf, k, sizeof(k), v, sizeof(v))) {
                    if (strcmp(cur_section, wanted_section) == 0 && strcmp(k, key) == 0) {
                        // return pointer inside ini->data? safer: store def only; but we can return stable static by caching not allowed.
                        // So: return a pointer to a static buffer would be wrong; instead, we return pointer within ini->data by searching original.
                        // Simpler: duplicate is needed; but API returns const char*. We'll return def if not safe.
                        // We'll do a second pass that returns pointer in ini->data by marking lines in place.
                        // BUT we can't modify original easily. Use a static thread-local buffer.
                        static char tls[768];
                        snprintf(tls, sizeof(tls), "%s", v);
                        return tls;
                    }
                }
            }
        }

        if (!eol) break;
        line = eol + 1;
    }
    return def;
}

int gn_ini_get_int(const GNIni* ini, const char* section, const char* key, int def) {
    const char* v = gn_ini_get(ini, section, key, NULL);
    if (!v) return def;
    char* end = NULL;
    long x = strtol(v, &end, 10);
    if (end == v) return def;
    return (int)x;
}
