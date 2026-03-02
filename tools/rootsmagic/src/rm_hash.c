#include "rm_hash.h"

uint64_t rm_fnv1a64(const unsigned char *data, size_t n) {
    uint64_t h = 1469598103934665603ULL;
    size_t i;
    for (i = 0; i < n; i++) {
        h ^= (uint64_t)data[i];
        h *= 1099511628211ULL;
    }
    return h;
}

void rm_hash_hex64(uint64_t v, char out[17]) {
    static const char HEX[] = "0123456789abcdef";
    int i;
    for (i = 15; i >= 0; i--) {
        out[i] = HEX[(int)(v & 0xF)];
        v >>= 4;
    }
    out[16] = '\0';
}

void rm_hash_string(const char *s, char out[17]) {
    size_t n = 0;
    while (s[n]) n++;
    rm_hash_hex64(rm_fnv1a64((const unsigned char *)s, n), out);
}
