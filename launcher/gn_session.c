#include "gn_session.h"
#include "gn_log.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <sqlite3.h>

#ifdef _WIN32
#include <direct.h>
#define MKDIR(p) _mkdir(p)
#else
#include <sys/stat.h>
#define MKDIR(p) mkdir(p, 0755)
#endif

static void now_stamp(char* out, size_t n) {
    time_t t = time(NULL);
    struct tm tmv;
#ifdef _WIN32
    localtime_s(&tmv, &t);
#else
    localtime_r(&t, &tmv);
#endif
    snprintf(out, n, "%04d%02d%02d_%02d%02d%02d",
             tmv.tm_year+1900, tmv.tm_mon+1, tmv.tm_mday,
             tmv.tm_hour, tmv.tm_min, tmv.tm_sec);
}

static void ensure_dir(const char* path) {
    if (!path || !path[0]) return;
    MKDIR(path); // ignore errors
}

static int sqlite_init_db(const char* db_path, const char* log_path) {
    sqlite3* db = NULL;
    if (sqlite3_open(db_path, &db) != SQLITE_OK) {
        gn_log_appendf(log_path, "ERROR sqlite3_open: %s\n", db ? sqlite3_errmsg(db) : "(null)");
        if (db) sqlite3_close(db);
        return 3;
    }

    const char* pragmas =
        "PRAGMA journal_mode=WAL;"
        "PRAGMA synchronous=NORMAL;"
        "PRAGMA foreign_keys=ON;";

    char* err = NULL;
    if (sqlite3_exec(db, pragmas, NULL, NULL, &err) != SQLITE_OK) {
        gn_log_appendf(log_path, "ERROR pragmas: %s\n", err ? err : "(null)");
        sqlite3_free(err);
        sqlite3_close(db);
        return 3;
    }

    const char* schema =
        "CREATE TABLE IF NOT EXISTS persons("
        " id TEXT PRIMARY KEY,"
        " given TEXT, surname TEXT, sex TEXT,"
        " birth_date TEXT, death_date TEXT,"
        " main_place TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS families("
        " id TEXT PRIMARY KEY,"
        " husband_id TEXT, wife_id TEXT,"
        " marriage_date TEXT, marriage_place TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS events("
        " id INTEGER PRIMARY KEY AUTOINCREMENT,"
        " person_id TEXT, type TEXT, date TEXT, place TEXT, source_ref TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS titles("
        " id INTEGER PRIMARY KEY AUTOINCREMENT,"
        " person_id TEXT, house TEXT, title TEXT, from_date TEXT, to_date TEXT, source_ref TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS sources("
        " id TEXT PRIMARY KEY,"
        " citation TEXT, url TEXT, archive_ref TEXT, quality_score REAL"
        ");"
        "CREATE TABLE IF NOT EXISTS job_runs("
        " id INTEGER PRIMARY KEY AUTOINCREMENT,"
        " job_name TEXT, started_at TEXT, ended_at TEXT,"
        " status TEXT, git_hash TEXT, log_path TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS metadata("
        " key TEXT PRIMARY KEY,"
        " value TEXT"
        ");";

    if (sqlite3_exec(db, schema, NULL, NULL, &err) != SQLITE_OK) {
        gn_log_appendf(log_path, "ERROR schema: %s\n", err ? err : "(null)");
        sqlite3_free(err);
        sqlite3_close(db);
        return 3;
    }

    sqlite3_close(db);
    return 0;
}

static int copy_file(const char* src, const char* dst) {
    FILE* a = fopen(src, "rb");
    if (!a) return 2;
    FILE* b = fopen(dst, "wb");
    if (!b) { fclose(a); return 2; }
    char buf[1<<16];
    size_t n;
    while ((n = fread(buf, 1, sizeof(buf), a)) > 0) {
        if (fwrite(buf, 1, n, b) != n) { fclose(a); fclose(b); return 3; }
    }
    fclose(a); fclose(b);
    return 0;
}

void gn_session_init(GNSession* s) {
    memset(s, 0, sizeof(*s));
}

int gn_session_is_open(const GNSession* s) {
    return s && s->is_open;
}

int gn_session_open(GNSession* s, const char* runtime_dir) {
    if (!s || !runtime_dir) return 3;
    if (s->is_open) return 0;

    char stamp[64];
    now_stamp(stamp, sizeof(stamp));

    char tmp_dir[512];
    char logs_dir[512];
    snprintf(tmp_dir, sizeof(tmp_dir), "%s/tmp", runtime_dir);
    snprintf(logs_dir, sizeof(logs_dir), "%s/logs", runtime_dir);

    ensure_dir(runtime_dir);
    ensure_dir(tmp_dir);
    ensure_dir(logs_dir);

    snprintf(s->session_dir, sizeof(s->session_dir), "%s/tmp/session_%s", runtime_dir, stamp);
    ensure_dir(s->session_dir);

    snprintf(s->db_path, sizeof(s->db_path), "%s/session.sqlite", s->session_dir);
    snprintf(s->log_path, sizeof(s->log_path), "%s/logs/session_%s.log", runtime_dir, stamp);

    gn_log_appendf(s->log_path, "SESSION OPEN\nDIR=%s\nDB=%s\n", s->session_dir, s->db_path);

    int rc = sqlite_init_db(s->db_path, s->log_path);
    if (rc != 0) return rc;

    s->is_open = 1;
    gn_log_appendf(s->log_path, "DB READY\n");
    return 0;
}

void gn_session_close(GNSession* s) {
    if (!s || !s->is_open) return;
    gn_log_appendf(s->log_path, "SESSION CLOSE\n");
    s->is_open = 0;
}

int gn_session_snapshot(const GNSession* s, const char* runtime_dir) {
    if (!s || !s->is_open || !runtime_dir) return 2;

    char snap_dir[512];
    snprintf(snap_dir, sizeof(snap_dir), "%s/snapshots", runtime_dir);
    ensure_dir(snap_dir);

    char stamp[64];
    now_stamp(stamp, sizeof(stamp));

    char dst[512];
    snprintf(dst, sizeof(dst), "%s/snapshots/snapshot_%s.sqlite", runtime_dir, stamp);

    int rc = copy_file(s->db_path, dst);
    gn_log_appendf(s->log_path, "SNAPSHOT rc=%d -> %s\n", rc, dst);
    return rc;
}
