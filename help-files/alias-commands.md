# RangerPlex Alias Commands (v2.11.0)

Quick reference for chat/run aliases. Prefixing with `/` also works (e.g., `/moon`).

## Astronomical / Weather (no API key required unless noted)
- `moon` — Moon phase (monochrome ASCII, 6s timeout).
- `sun` — Sunrise/sunset summary (monochrome ASCII, 6s timeout).
- `nycweather` — NYC snapshot via wttr (1-line text, 6s timeout).
- `dublinweather` — Dublin snapshot via wttr (1-line text, 6s timeout).
- `londonweather` — London snapshot via wttr (1-line text, 6s timeout).
- `parisweather` — Paris snapshot via wttr (1-line text, 6s timeout).
- `weather` — wttr.in plain weather (may hit wttr quotas).
- `wet` — Open-Meteo snapshot for Dublin (no key, JSON-ish text, 6s timeout).

## Time / Utilities
- `nddy` — Timestamp `%d %b %Y %T %z`.
- `ny` — New York live clock (`tty-clock`).
- `myip` — Public IP via ipinfo.io.

## Git (read-only)
- `gitstatus` — `git status`.
- `gitlog` — `git log -n 5 --oneline`.

## System / Files
- `diskfree` — `df -h` (POSIX).
- `sysuptime` — `uptime` (POSIX).
- `findjs` — `find . -name "*.js"` (POSIX).
- `windir` — `dir` (Windows).
- `winps-dir` — `powershell -Command Get-ChildItem` (Windows).
- `windisk` — `powershell -Command Get-PSDrive` (Windows).

## Custom
- `rangerbot` — Runs Rangerbot chat (Python, custom cwd; confirmation required).

## Behavior Notes
- Leading slash `/alias` is accepted.
- Commands run with validation (no pipes/redirects/subshells from user text) and a 60s default timeout.
- Stop button turns red while streaming; click to abort.
- Outputs: ANSI stripped; long outputs truncated; curl progress hidden. When ANSI is present, a clean text block is shown.
