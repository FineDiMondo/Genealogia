#include <stdio.h>

/*
 * db_manifest.c
 * MVP wrapper entrypoint.
 * Manifest generation (SHA256 + counts) is currently implemented in db_backup.cmd via PowerShell.
 */
int main(int argc, char** argv) {
    (void)argc;
    (void)argv;
    printf("db_manifest: use tools\\db\\db_backup.cmd for manifest generation\n");
    return 0;
}
