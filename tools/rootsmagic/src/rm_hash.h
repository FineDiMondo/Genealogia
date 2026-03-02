#pragma once

#include <stddef.h>
#include <stdint.h>

uint64_t rm_fnv1a64(const unsigned char *data, size_t n);
void rm_hash_hex64(uint64_t v, char out[17]);
void rm_hash_string(const char *s, char out[17]);
