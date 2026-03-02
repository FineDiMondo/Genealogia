#include <stdio.h>
#include <string.h>

/*
 * db_lock.c
 * Minimal lock helper.
 * Usage:
 *   db_lock acquire <lockfile>
 *   db_lock release <lockfile>
 */
int main(int argc, char** argv) {
    if (argc < 3) {
        fprintf(stderr, "Usage: db_lock <acquire|release> <lockfile>\n");
        return 2;
    }
    const char* op = argv[1];
    const char* lockfile = argv[2];

    if (strcmp(op, "acquire") == 0) {
        FILE* exists = fopen(lockfile, "rb");
        if (exists) {
            fclose(exists);
            fprintf(stderr, "(ERR) DB BUSY - lock exists: %s\n", lockfile);
            return 3;
        }
        FILE* f = fopen(lockfile, "wb");
        if (!f) {
            fprintf(stderr, "(ERR) cannot create lock: %s\n", lockfile);
            return 3;
        }
        fputs("locked\n", f);
        fclose(f);
        return 0;
    }

    if (strcmp(op, "release") == 0) {
        if (remove(lockfile) != 0) {
            return 1;
        }
        return 0;
    }

    fprintf(stderr, "Unknown operation: %s\n", op);
    return 2;
}
