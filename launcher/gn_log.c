#include "gn_log.h"
#include <stdio.h>
#include <stdarg.h>

void gn_log_appendf(const char* path, const char* fmt, ...) {
    if (!path || !fmt) return;
    FILE* f = fopen(path, "ab");
    if (!f) return;
    va_list ap;
    va_start(ap, fmt);
    vfprintf(f, fmt, ap);
    va_end(ap);
    fclose(f);
}
