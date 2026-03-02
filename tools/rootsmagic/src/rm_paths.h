#pragma once

int rm_ensure_dir(const char *path);
int rm_ensure_data_dirs(void);
void rm_join_path(char *out, int out_n, const char *a, const char *b);
