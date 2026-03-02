#include "rm_eventlog.h"

static void js_escape(const char *in, char *out, int out_n) {
    int i = 0;
    int j = 0;
    while (in[i] && j < out_n - 1) {
        char c = in[i++];
        if (c == '"' || c == '\\') {
            if (j < out_n - 2) {
                out[j++] = '\\';
                out[j++] = c;
            }
        } else if (c == '\n' || c == '\r' || c == '\t') {
            out[j++] = ' ';
        } else {
            out[j++] = c;
        }
    }
    out[j] = '\0';
}

int rm_append_event(FILE *f, const char *ts, const char *type, const char *entity,
                    const char *id, const char *title, const char *ref, const char *importance) {
    char e_ts[64], e_type[128], e_entity[64], e_id[64], e_title[512], e_ref[128], e_imp[32];
    js_escape(ts ? ts : "", e_ts, (int)sizeof(e_ts));
    js_escape(type ? type : "", e_type, (int)sizeof(e_type));
    js_escape(entity ? entity : "", e_entity, (int)sizeof(e_entity));
    js_escape(id ? id : "", e_id, (int)sizeof(e_id));
    js_escape(title ? title : "", e_title, (int)sizeof(e_title));
    js_escape(ref ? ref : "", e_ref, (int)sizeof(e_ref));
    js_escape(importance ? importance : "minor", e_imp, (int)sizeof(e_imp));

    fprintf(
        f,
        "{\"ts\":\"%s\",\"type\":\"%s\",\"entity\":\"%s\",\"id\":\"%s\",\"title\":\"%s\",\"refs\":[\"%s\"],\"by\":\"rm_import\",\"importance\":\"%s\"}\n",
        e_ts, e_type, e_entity, e_id, e_title, e_ref, e_imp
    );
    return 0;
}
