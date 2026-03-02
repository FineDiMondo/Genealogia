#include <stdio.h>

/*
 * db_pack.c
 * MVP wrapper entrypoint.
 * Real packing is delegated to PowerShell Compress-Archive in db_backup.cmd.
 */
int main(int argc, char** argv) {
    (void)argc;
    (void)argv;
    printf("db_pack: use tools\\db\\db_backup.cmd (Compress-Archive backend)\n");
    return 0;
}
