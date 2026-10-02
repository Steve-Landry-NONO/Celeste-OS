"""Isolate each disposable CI stack from other runner services."""
import os
import pathlib
import re
import socket

run_id = os.environ["GITHUB_RUN_ID"]
attempt = os.environ["GITHUB_RUN_ATTEMPT"]
if not run_id.isdecimal() or not attempt.isdecimal():
    raise ValueError("Invalid CI run identity")
config = pathlib.Path("supabase/config.toml")
text = config.read_text()
text = re.sub(r'^project_id = ".*"$', f'project_id = "celeste-ci-{run_id}-{attempt}"', text, count=1, flags=re.M)
start = 20000 + (int(run_id) % 3000) * 10
for offset in range(3000):
    base = 20000 + ((start - 20000 + offset * 10) % 30000)
    sockets = []
    try:
        for port in range(base, base + 6):
            sock = socket.socket()
            sockets.append(sock)
            sock.bind(("127.0.0.1", port))
        break
    except OSError:
        continue
    finally:
        for sock in sockets:
            sock.close()
else:
    raise RuntimeError("No free ports for disposable Supabase")
for section, key, port in [("api", "port", base), ("db", "port", base+1), ("db", "shadow_port", base+2), ("studio", "port", base+3), ("local_smtp", "port", base+4), ("analytics", "port", base+5)]:
    pattern = rf'(\[{re.escape(section)}\]\n(?:(?!\[)[^\n]*\n)*?^{re.escape(key)} = )\d+'
    text, count = re.subn(pattern, rf'\g<1>{port}', text, count=1, flags=re.M)
    if count != 1:
        raise ValueError(f"Missing local configuration {section}.{key}")
config.write_text(text)
print("Disposable Supabase stack isolated by CI run; free ports selected.")
