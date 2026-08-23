# ADR 0001: Query client and mutation log

## Status

Accepted

## Decision

Remote/server state uses one TanStack Query client. Offline writes use a serial mutation log with client UUIDs. Context stays for auth, theme, toast, and Semester timetable ownership.
