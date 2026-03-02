#include "rm_paths.h"

#ifdef _WIN32
#include <direct.h>
#define MKDIR(p) _mkdir(p)
#else
#include <sys/stat.h>
#define MKDIR(p) mkdir((p), 0755)
#endif

int rm_ensure_dir(const char *path) {
    int rc = MKDIR(path);
    if (rc == 0) return 0;
    return 0;
}

int rm_ensure_data_dirs(void) {
    rm_ensure_dir("data");
    rm_ensure_dir("data/current");
    rm_ensure_dir("data/current/entities");
    rm_ensure_dir("data/current/indexes");
    rm_ensure_dir("data/current/meta");
    rm_ensure_dir("data/in");
    return 0;
}

void rm_join_path(char *out, int out_n, const char *a, const char *b) {
    int i = 0;
    int j = 0;
    while (a[i] && i < out_n - 1) out[i++] = a[i];
    if (i > 0 && out[i - 1] != '/' && out[i - 1] != '\\' && i < out_n - 1) out[i++] = '/';
    while (b[j] && i < out_n - 1) out[i++] = b[j++];
    out[i] = '\0';
}
