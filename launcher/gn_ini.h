#pragma once
#include <stddef.h>

typedef struct {
    char* data;
    size_t data_len;
} GNIni;

int  gn_ini_load(GNIni* ini, const char* path);
void gn_ini_free(GNIni* ini);

const char* gn_ini_get(const GNIni* ini, const char* section, const char* key, const char* def);
int  gn_ini_get_int(const GNIni* ini, const char* section, const char* key, int def);
