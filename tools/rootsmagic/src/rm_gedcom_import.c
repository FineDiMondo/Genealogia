#include "rm_eventlog.h"
#include "rm_gedcom_parser.h"
#include "rm_hash.h"
#include "rm_paths.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

typedef struct {
    char entity[16];
    char id[32];
    char hash[17];
} SnapItem;

typedef struct {
    SnapItem *items;
    int count;
    int cap;
} SnapList;

static void snap_init(SnapList *s) { memset(s, 0, sizeof(*s)); }
static void snap_free(SnapList *s) { free(s->items); memset(s, 0, sizeof(*s)); }

static int snap_add(SnapList *s, const char *entity, const char *id, const char *hash) {
    if (s->count >= s->cap) {
        int ncap = s->cap ? s->cap * 2 : 256;
        SnapItem *p = (SnapItem *)realloc(s->items, (size_t)ncap * sizeof(SnapItem));
        if (!p) return 3;
        s->items = p;
        s->cap = ncap;
    }
    memset(&s->items[s->count], 0, sizeof(SnapItem));
    strncpy(s->items[s->count].entity, entity, sizeof(s->items[s->count].entity) - 1);
    strncpy(s->items[s->count].id, id, sizeof(s->items[s->count].id) - 1);
    strncpy(s->items[s->count].hash, hash, sizeof(s->items[s->count].hash) - 1);
    s->count++;
    return 0;
}

static const char *snap_find_hash(const SnapList *s, const char *entity, const char *id) {
    int i;
    for (i = 0; i < s->count; i++) {
        if (strcmp(s->items[i].entity, entity) == 0 && strcmp(s->items[i].id, id) == 0) return s->items[i].hash;
    }
    return NULL;
}

static int snap_exists(const SnapList *s, const char *entity, const char *id) {
    return snap_find_hash(s, entity, id) != NULL;
}

static void now_iso(char out[32]) {
    time_t t = time(NULL);
    struct tm tmv;
#ifdef _WIN32
    gmtime_s(&tmv, &t);
#else
    gmtime_r(&t, &tmv);
#endif
    snprintf(out, 32, "%04d-%02d-%02dT%02d:%02d:%02dZ",
             tmv.tm_year + 1900, tmv.tm_mon + 1, tmv.tm_mday,
             tmv.tm_hour, tmv.tm_min, tmv.tm_sec);
}

static int read_all(const char *path, unsigned char **buf, size_t *n) {
    FILE *f = fopen(path, "rb");
    long sz;
    size_t rd;
    if (!f) return 2;
    fseek(f, 0, SEEK_END);
    sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (sz < 0) { fclose(f); return 2; }
    *buf = (unsigned char *)malloc((size_t)sz + 1);
    if (!*buf) { fclose(f); return 3; }
    rd = fread(*buf, 1, (size_t)sz, f);
    fclose(f);
    (*buf)[rd] = 0;
    *n = rd;
    return 0;
}

static void mk_person_id(const RMPerson *p, char out[32]) {
    char key[512], h[17];
    snprintf(key, sizeof(key), "%s|%s|%s", p->xref, p->name, p->birth_date);
    rm_hash_string(key, h);
    snprintf(out, 32, "P#%s", h);
}

static void mk_family_id(const RMFamily *f, char out[32]) {
    char key[512], h[17];
    snprintf(key, sizeof(key), "%s|%s|%s|%s", f->xref, f->husb, f->wife, f->marr_date);
    rm_hash_string(key, h);
    snprintf(out, 32, "F#%s", h);
}

static void mk_source_id(const RMSource *s, char out[32]) {
    char key[512], h[17];
    snprintf(key, sizeof(key), "%s|%s", s->xref, s->titl);
    rm_hash_string(key, h);
    snprintf(out, 32, "S#%s", h);
}

static void esc(const char *in, char *out, int out_n) {
    int i = 0, j = 0;
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

static void upper(const char *in, char *out, int out_n) {
    int i = 0, j = 0;
    while (in[i] && j < out_n - 1) {
        char c = in[i++];
        if (c >= 'a' && c <= 'z') c = (char)(c - 32);
        if (c == '/' || c == '\t' || c == '\n' || c == '\r') continue;
        out[j++] = c;
    }
    out[j] = '\0';
}

static void person_hash(const RMPerson *p, char out[17]) {
    char key[2048];
    snprintf(key, sizeof(key), "%s|%s|%s|%s|%s|%s|%s|%s", p->xref, p->name, p->sex, p->birth_date, p->birth_plac, p->death_date, p->death_plac, p->fs_id);
    rm_hash_string(key, out);
}

static void family_hash(const RMFamily *f, char out[17]) {
    char key[2048];
    snprintf(key, sizeof(key), "%s|%s|%s|%s|%s|%s", f->xref, f->husb, f->wife, f->marr_date, f->marr_plac, f->note);
    rm_hash_string(key, out);
}

static void source_hash(const RMSource *s, char out[17]) {
    char key[1024];
    snprintf(key, sizeof(key), "%s|%s|%s", s->xref, s->titl, s->note);
    rm_hash_string(key, out);
}

static int load_snapshot(const char *path, SnapList *snap) {
    unsigned char *buf = NULL;
    size_t n = 0;
    char *p;
    if (read_all(path, &buf, &n) != 0) return 0;
    p = (char *)buf;
    while ((p = strstr(p, "\"entity\":\"")) != NULL) {
        char e[16] = {0}, id[32] = {0}, h[17] = {0};
        char *q;
        p += 10;
        q = strchr(p, '"'); if (!q) break;
        strncpy(e, p, (size_t)(q - p) < sizeof(e) - 1 ? (size_t)(q - p) : sizeof(e) - 1);
        p = strstr(q, "\"id\":\""); if (!p) break;
        p += 6; q = strchr(p, '"'); if (!q) break;
        strncpy(id, p, (size_t)(q - p) < sizeof(id) - 1 ? (size_t)(q - p) : sizeof(id) - 1);
        p = strstr(q, "\"hash\":\""); if (!p) break;
        p += 8; q = strchr(p, '"'); if (!q) break;
        strncpy(h, p, (size_t)(q - p) < sizeof(h) - 1 ? (size_t)(q - p) : sizeof(h) - 1);
        snap_add(snap, e, id, h);
        p = q + 1;
    }
    free(buf);
    return 0;
}

static int write_snapshot(const char *path, const SnapList *snap) {
    FILE *f = fopen(path, "wb");
    int i;
    if (!f) return 3;
    fprintf(f, "{\n  \"version\":\"1.0\",\n  \"items\":[\n");
    for (i = 0; i < snap->count; i++) {
        fprintf(f, "    {\"entity\":\"%s\",\"id\":\"%s\",\"hash\":\"%s\"}%s\n",
                snap->items[i].entity, snap->items[i].id, snap->items[i].hash,
                (i == snap->count - 1) ? "" : ",");
    }
    fprintf(f, "  ]\n}\n");
    fclose(f);
    return 0;
}

static int write_last_import(const char *path, const char *hash, int persons, int families, int sources, int events_added) {
    FILE *f = fopen("data/current/meta/last_import.json", "wb");
    char ts[32];
    if (!f) return 3;
    now_iso(ts);
    fprintf(f,
            "{\n  \"timestamp\":\"%s\",\n  \"version\":\"1.0\",\n  \"source\":\"rootsmagic_gedcom\",\n  \"input_file\":\"%s\",\n  \"file_hash\":\"%s\",\n  \"counts\":{\"persons\":%d,\"families\":%d,\"sources\":%d,\"events_added\":%d}\n}\n",
            ts, path, hash, persons, families, sources, events_added);
    fclose(f);
    return 0;
}

int main(int argc, char **argv) {
    const char *ged = argc > 1 ? argv[1] : "data/in/rootsmagic.ged";
    RMGedcomData d;
    SnapList old_snap, new_snap;
    unsigned char *raw = NULL;
    size_t raw_n = 0;
    char fhash[17];
    char err[256] = {0};
    FILE *ev;
    FILE *fp, *ff, *fs, *idxn, *idxfs;
    int i, rc;
    int warnings = 0;
    int events_added = 0;
    char ts[32];

    rm_ensure_data_dirs();

    rc = read_all(ged, &raw, &raw_n);
    if (rc != 0) {
        fprintf(stderr, "INPUT ERROR: missing GEDCOM %s\n", ged);
        return 2;
    }
    rm_hash_hex64(rm_fnv1a64(raw, raw_n), fhash);
    free(raw);

    rc = rm_parse_gedcom_file(ged, &d, err, (int)sizeof(err));
    if (rc != 0) {
        fprintf(stderr, "PARSE ERROR: %s\n", err);
        return rc == 2 ? 2 : 3;
    }

    snap_init(&old_snap);
    snap_init(&new_snap);
    load_snapshot("data/current/meta/snapshot_hashes.json", &old_snap);

    fp = fopen("data/current/entities/persons.ndjson", "wb");
    ff = fopen("data/current/entities/families.ndjson", "wb");
    fs = fopen("data/current/entities/sources.ndjson", "wb");
    idxn = fopen("data/current/indexes/person_name.idx", "wb");
    idxfs = fopen("data/current/indexes/person_fs_id.idx", "wb");
    ev = fopen("data/current/events.ndjson", "ab");
    if (!fp || !ff || !fs || !idxn || !idxfs || !ev) {
        rm_gd_free(&d);
        snap_free(&old_snap);
        snap_free(&new_snap);
        return 3;
    }

    now_iso(ts);

    for (i = 0; i < d.person_count; i++) {
        const RMPerson *p = &d.persons[i];
        char id[32], h[17], e_name[256], e_note[600], e_bp[180], e_dp[180], key[256];
        const char *old_h;
        mk_person_id(p, id);
        person_hash(p, h);
        snap_add(&new_snap, "person", id, h);
        old_h = snap_find_hash(&old_snap, "person", id);

        esc(p->name, e_name, (int)sizeof(e_name));
        esc(p->note, e_note, (int)sizeof(e_note));
        esc(p->birth_plac, e_bp, (int)sizeof(e_bp));
        esc(p->death_plac, e_dp, (int)sizeof(e_dp));
        fprintf(fp, "{\"id\":\"%s\",\"xref\":\"%s\",\"name\":\"%s\",\"sex\":\"%s\",\"birth_date\":\"%s\",\"birth_place\":\"%s\",\"death_date\":\"%s\",\"death_place\":\"%s\",\"fs_id\":\"%s\",\"note\":\"%s\",\"active\":true}\n",
                id, p->xref, e_name, p->sex, p->birth_date, e_bp, p->death_date, e_dp, p->fs_id, e_note);

        upper(p->name, key, (int)sizeof(key));
        fprintf(idxn, "%s|%s\n", key, id);
        if (p->fs_id[0]) fprintf(idxfs, "%s|%s\n", p->fs_id, id);

        if (!old_h) {
            rm_append_event(ev, ts, "person.added", "person", id, p->name[0] ? p->name : id, p->xref, "major");
            events_added++;
        } else if (strcmp(old_h, h) != 0) {
            rm_append_event(ev, ts, "person.updated", "person", id, p->name[0] ? p->name : id, p->xref, "minor");
            events_added++;
        }
        if (p->fs_id[0]) {
            rm_append_event(ev, ts, "person.linked_fs", "person", id, p->fs_id, p->xref, "minor");
            events_added++;
        }
    }

    for (i = 0; i < d.family_count; i++) {
        const RMFamily *fam = &d.families[i];
        char id[32], h[17], children[512], e_note[600], e_mp[180];
        const char *old_h;
        int c;
        mk_family_id(fam, id);
        family_hash(fam, h);
        snap_add(&new_snap, "family", id, h);
        old_h = snap_find_hash(&old_snap, "family", id);

        children[0] = '\0';
        for (c = 0; c < fam->chil_count; c++) {
            if (c > 0) strncat(children, ",", sizeof(children) - strlen(children) - 1);
            strncat(children, fam->chil[c], sizeof(children) - strlen(children) - 1);
        }
        esc(fam->note, e_note, (int)sizeof(e_note));
        esc(fam->marr_plac, e_mp, (int)sizeof(e_mp));
        fprintf(ff, "{\"id\":\"%s\",\"xref\":\"%s\",\"husb\":\"%s\",\"wife\":\"%s\",\"children\":\"%s\",\"marr_date\":\"%s\",\"marr_place\":\"%s\",\"note\":\"%s\",\"active\":true}\n",
                id, fam->xref, fam->husb, fam->wife, children, fam->marr_date, e_mp, e_note);

        if (!old_h) {
            rm_append_event(ev, ts, "family.added", "family", id, fam->xref, fam->xref, "major");
            events_added++;
        } else if (strcmp(old_h, h) != 0) {
            rm_append_event(ev, ts, "family.updated", "family", id, fam->xref, fam->xref, "minor");
            events_added++;
        }
    }

    for (i = 0; i < d.source_count; i++) {
        const RMSource *s = &d.sources[i];
        char id[32], h[17], e_t[300], e_n[600];
        const char *old_h;
        mk_source_id(s, id);
        source_hash(s, h);
        snap_add(&new_snap, "source", id, h);
        old_h = snap_find_hash(&old_snap, "source", id);
        esc(s->titl, e_t, (int)sizeof(e_t));
        esc(s->note, e_n, (int)sizeof(e_n));
        fprintf(fs, "{\"id\":\"%s\",\"xref\":\"%s\",\"title\":\"%s\",\"note\":\"%s\",\"active\":true}\n", id, s->xref, e_t, e_n);
        if (!old_h) {
            rm_append_event(ev, ts, "source.added", "source", id, s->titl[0] ? s->titl : s->xref, s->xref, "minor");
            events_added++;
        } else if (strcmp(old_h, h) != 0) {
            rm_append_event(ev, ts, "source.updated", "source", id, s->titl[0] ? s->titl : s->xref, s->xref, "minor");
            events_added++;
        }
    }

    for (i = 0; i < old_snap.count; i++) {
        if (!snap_exists(&new_snap, old_snap.items[i].entity, old_snap.items[i].id)) {
            char et[32];
            snprintf(et, sizeof(et), "%s.removed", old_snap.items[i].entity);
            rm_append_event(ev, ts, et, old_snap.items[i].entity, old_snap.items[i].id, old_snap.items[i].id, old_snap.items[i].id, "major");
            warnings++;
            events_added++;
        }
    }

    fclose(fp);
    fclose(ff);
    fclose(fs);
    fclose(idxn);
    fclose(idxfs);
    fclose(ev);

    write_snapshot("data/current/meta/snapshot_hashes.json", &new_snap);
    write_last_import(ged, fhash, d.person_count, d.family_count, d.source_count, events_added);

    fprintf(stdout, "RM IMPORT OK persons=%d families=%d sources=%d events=%d\n", d.person_count, d.family_count, d.source_count, events_added);

    {
        int person_count = d.person_count;
        rm_gd_free(&d);
        snap_free(&old_snap);
        snap_free(&new_snap);
        if (person_count < 1 || warnings > 0) return 1;
    }
    return 0;
}
