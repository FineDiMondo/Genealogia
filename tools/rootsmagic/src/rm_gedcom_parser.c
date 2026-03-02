#include "rm_gedcom_parser.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void trim(char *s) {
    int i = 0;
    int n;
    while (s[i] && isspace((unsigned char)s[i])) i++;
    if (i > 0) memmove(s, s + i, strlen(s + i) + 1);
    n = (int)strlen(s);
    while (n > 0 && isspace((unsigned char)s[n - 1])) s[--n] = '\0';
}

static void append_text(char *dst, int dst_n, const char *src, int newline) {
    int cur = (int)strlen(dst);
    int i = 0;
    if (newline && cur > 0 && cur < dst_n - 1) dst[cur++] = '\n';
    while (src[i] && cur < dst_n - 1) dst[cur++] = src[i++];
    dst[cur] = '\0';
}

static int ensure_person_cap(RMGedcomData *d) {
    if (d->person_count < d->person_cap) return 0;
    {
        int ncap = d->person_cap ? d->person_cap * 2 : 256;
        RMPerson *p = (RMPerson *)realloc(d->persons, (size_t)ncap * sizeof(RMPerson));
        if (!p) return 2;
        d->persons = p;
        d->person_cap = ncap;
    }
    return 0;
}

static int ensure_family_cap(RMGedcomData *d) {
    if (d->family_count < d->family_cap) return 0;
    {
        int ncap = d->family_cap ? d->family_cap * 2 : 128;
        RMFamily *p = (RMFamily *)realloc(d->families, (size_t)ncap * sizeof(RMFamily));
        if (!p) return 2;
        d->families = p;
        d->family_cap = ncap;
    }
    return 0;
}

static int ensure_source_cap(RMGedcomData *d) {
    if (d->source_count < d->source_cap) return 0;
    {
        int ncap = d->source_cap ? d->source_cap * 2 : 128;
        RMSource *p = (RMSource *)realloc(d->sources, (size_t)ncap * sizeof(RMSource));
        if (!p) return 2;
        d->sources = p;
        d->source_cap = ncap;
    }
    return 0;
}

static void maybe_extract_fsid(const char *text, char *fs_id, int fs_n) {
    const char *keys[] = {"FSFTID", "FamilySearch", "FSID", "_FSFTID"};
    int k;
    if (fs_id[0]) return;
    for (k = 0; k < 4; k++) {
        const char *p = strstr(text, keys[k]);
        int i = 0;
        if (!p) continue;
        while (*p && *p != ':' && *p != '=' && !isspace((unsigned char)*p)) p++;
        while (*p && (*p == ':' || *p == '=' || isspace((unsigned char)*p))) p++;
        while (*p && i < fs_n - 1 && (isalnum((unsigned char)*p) || *p == '-')) fs_id[i++] = *p++;
        fs_id[i] = '\0';
        if (i >= 4) return;
        fs_id[0] = '\0';
    }
}

void rm_gd_init(RMGedcomData *d) { memset(d, 0, sizeof(*d)); }

void rm_gd_free(RMGedcomData *d) {
    free(d->persons);
    free(d->families);
    free(d->sources);
    memset(d, 0, sizeof(*d));
}

const RMPerson *rm_find_person_by_xref(const RMGedcomData *d, const char *xref) {
    int i;
    for (i = 0; i < d->person_count; i++) {
        if (strcmp(d->persons[i].xref, xref) == 0) return &d->persons[i];
    }
    return NULL;
}

int rm_parse_gedcom_file(const char *path, RMGedcomData *out, char *err, int err_n) {
    FILE *f = fopen(path, "rb");
    char line[2048];
    int sec = 0;
    int sub = 0;
    int pidx = -1, fidx = -1, sidx = -1;
    char *last_buf = NULL;
    int last_buf_n = 0;

    rm_gd_init(out);
    if (!f) {
        snprintf(err, (size_t)err_n, "Cannot open GEDCOM: %s", path);
        return 2;
    }

    while (fgets(line, (int)sizeof(line), f)) {
        char raw[2048];
        char t1[64] = {0}, t2[64] = {0};
        char *p;
        char *v;
        int level;
        int n;

        strncpy(raw, line, sizeof(raw) - 1);
        raw[sizeof(raw) - 1] = '\0';
        trim(raw);
        if (!raw[0]) continue;

        p = raw;
        level = (int)strtol(p, &p, 10);
        while (*p && isspace((unsigned char)*p)) p++;
        if (!*p) continue;

        n = 0;
        while (p[n] && !isspace((unsigned char)p[n]) && n < (int)sizeof(t1) - 1) t1[n++] = p[n];
        t1[n] = '\0';
        p += n;
        while (*p && isspace((unsigned char)*p)) p++;

        n = 0;
        while (p[n] && !isspace((unsigned char)p[n]) && n < (int)sizeof(t2) - 1) t2[n++] = p[n];
        t2[n] = '\0';
        p += n;
        while (*p && isspace((unsigned char)*p)) p++;
        v = p;

        if (level == 0) {
            sec = 0;
            sub = 0;
            last_buf = NULL;
            last_buf_n = 0;

            if (t1[0] == '@' && strcmp(t2, "INDI") == 0) {
                if (ensure_person_cap(out) != 0) { fclose(f); snprintf(err, (size_t)err_n, "OOM persons"); return 3; }
                pidx = out->person_count++;
                memset(&out->persons[pidx], 0, sizeof(RMPerson));
                strncpy(out->persons[pidx].xref, t1, sizeof(out->persons[pidx].xref) - 1);
                sec = 1;
            } else if (t1[0] == '@' && strcmp(t2, "FAM") == 0) {
                if (ensure_family_cap(out) != 0) { fclose(f); snprintf(err, (size_t)err_n, "OOM families"); return 3; }
                fidx = out->family_count++;
                memset(&out->families[fidx], 0, sizeof(RMFamily));
                strncpy(out->families[fidx].xref, t1, sizeof(out->families[fidx].xref) - 1);
                sec = 2;
            } else if (t1[0] == '@' && strcmp(t2, "SOUR") == 0) {
                if (ensure_source_cap(out) != 0) { fclose(f); snprintf(err, (size_t)err_n, "OOM sources"); return 3; }
                sidx = out->source_count++;
                memset(&out->sources[sidx], 0, sizeof(RMSource));
                strncpy(out->sources[sidx].xref, t1, sizeof(out->sources[sidx].xref) - 1);
                sec = 3;
            }
            continue;
        }

        if (sec == 1 && pidx >= 0) {
            RMPerson *pr = &out->persons[pidx];
            if (level == 1) {
                sub = 0;
                if (strcmp(t1, "NAME") == 0) { strncpy(pr->name, v, sizeof(pr->name) - 1); last_buf = pr->name; last_buf_n = (int)sizeof(pr->name); }
                else if (strcmp(t1, "SEX") == 0) strncpy(pr->sex, v, sizeof(pr->sex) - 1);
                else if (strcmp(t1, "BIRT") == 0) sub = 1;
                else if (strcmp(t1, "DEAT") == 0) sub = 2;
                else if (strcmp(t1, "NOTE") == 0) { append_text(pr->note, (int)sizeof(pr->note), v, 0); maybe_extract_fsid(v, pr->fs_id, (int)sizeof(pr->fs_id)); last_buf = pr->note; last_buf_n = (int)sizeof(pr->note); }
                else if (strcmp(t1, "SOUR") == 0) strncpy(pr->sour, v, sizeof(pr->sour) - 1);
                else if (strcmp(t1, "REFN") == 0 || strcmp(t1, "UID") == 0 || strcmp(t1, "_UID") == 0 || strcmp(t1, "_FSFTID") == 0) maybe_extract_fsid(v, pr->fs_id, (int)sizeof(pr->fs_id));
            } else if (level == 2) {
                if (sub == 1 && strcmp(t1, "DATE") == 0) strncpy(pr->birth_date, v, sizeof(pr->birth_date) - 1);
                else if (sub == 1 && strcmp(t1, "PLAC") == 0) strncpy(pr->birth_plac, v, sizeof(pr->birth_plac) - 1);
                else if (sub == 2 && strcmp(t1, "DATE") == 0) strncpy(pr->death_date, v, sizeof(pr->death_date) - 1);
                else if (sub == 2 && strcmp(t1, "PLAC") == 0) strncpy(pr->death_plac, v, sizeof(pr->death_plac) - 1);
                else if (strcmp(t1, "CONC") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 0);
                else if (strcmp(t1, "CONT") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 1);
            }
        } else if (sec == 2 && fidx >= 0) {
            RMFamily *fa = &out->families[fidx];
            if (level == 1) {
                sub = 0;
                if (strcmp(t1, "HUSB") == 0) strncpy(fa->husb, v, sizeof(fa->husb) - 1);
                else if (strcmp(t1, "WIFE") == 0) strncpy(fa->wife, v, sizeof(fa->wife) - 1);
                else if (strcmp(t1, "CHIL") == 0 && fa->chil_count < 16) strncpy(fa->chil[fa->chil_count++], v, 31);
                else if (strcmp(t1, "MARR") == 0) sub = 3;
                else if (strcmp(t1, "NOTE") == 0) { append_text(fa->note, (int)sizeof(fa->note), v, 0); last_buf = fa->note; last_buf_n = (int)sizeof(fa->note); }
                else if (strcmp(t1, "SOUR") == 0) strncpy(fa->sour, v, sizeof(fa->sour) - 1);
            } else if (level == 2) {
                if (sub == 3 && strcmp(t1, "DATE") == 0) strncpy(fa->marr_date, v, sizeof(fa->marr_date) - 1);
                else if (sub == 3 && strcmp(t1, "PLAC") == 0) strncpy(fa->marr_plac, v, sizeof(fa->marr_plac) - 1);
                else if (strcmp(t1, "CONC") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 0);
                else if (strcmp(t1, "CONT") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 1);
            }
        } else if (sec == 3 && sidx >= 0) {
            RMSource *so = &out->sources[sidx];
            if (level == 1) {
                if (strcmp(t1, "TITL") == 0) { append_text(so->titl, (int)sizeof(so->titl), v, 0); last_buf = so->titl; last_buf_n = (int)sizeof(so->titl); }
                else if (strcmp(t1, "NOTE") == 0) { append_text(so->note, (int)sizeof(so->note), v, 0); last_buf = so->note; last_buf_n = (int)sizeof(so->note); }
            } else if (level >= 2) {
                if (strcmp(t1, "CONC") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 0);
                else if (strcmp(t1, "CONT") == 0 && last_buf) append_text(last_buf, last_buf_n, v, 1);
            }
        }
    }

    fclose(f);
    return 0;
}
