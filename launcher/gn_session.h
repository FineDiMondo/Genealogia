#pragma once

typedef struct {
    int  is_open;
    char session_dir[512];
    char db_path[512];
    char log_path[512];
} GNSession;

void gn_session_init(GNSession* s);
int  gn_session_is_open(const GNSession* s);
int  gn_session_open(GNSession* s, const char* runtime_dir);
void gn_session_close(GNSession* s);
int  gn_session_snapshot(const GNSession* s, const char* runtime_dir);
