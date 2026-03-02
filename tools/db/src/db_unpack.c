#include <stdio.h>

/*
 * db_unpack.c
 * MVP wrapper entrypoint.
 * Real unpack is delegated to PowerShell Expand-Archive in db_restore.cmd.
 */
int main(int argc, char** argv) {
    (void)argc;
    (void)argv;
    printf("db_unpack: use tools\\db\\db_restore.cmd (Expand-Archive backend)\n");
    return 0;
}
