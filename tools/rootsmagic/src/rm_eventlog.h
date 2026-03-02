#pragma once

#include <stdio.h>

int rm_append_event(FILE *f, const char *ts, const char *type, const char *entity,
                    const char *id, const char *title, const char *ref, const char *importance);
