#pragma once

typedef struct {
    char xref[32];
    char name[128];
    char sex[8];
    char birth_date[64];
    char birth_plac[128];
    char death_date[64];
    char death_plac[128];
    char note[512];
    char sour[64];
    char fs_id[64];
} RMPerson;

typedef struct {
    char xref[32];
    char husb[32];
    char wife[32];
    char chil[16][32];
    int chil_count;
    char marr_date[64];
    char marr_plac[128];
    char note[512];
    char sour[64];
} RMFamily;

typedef struct {
    char xref[32];
    char titl[256];
    char note[512];
} RMSource;

typedef struct {
    RMPerson *persons;
    int person_count;
    int person_cap;
    RMFamily *families;
    int family_count;
    int family_cap;
    RMSource *sources;
    int source_count;
    int source_cap;
} RMGedcomData;

void rm_gd_init(RMGedcomData *d);
void rm_gd_free(RMGedcomData *d);
int rm_parse_gedcom_file(const char *path, RMGedcomData *out, char *err, int err_n);
const RMPerson *rm_find_person_by_xref(const RMGedcomData *d, const char *xref);
