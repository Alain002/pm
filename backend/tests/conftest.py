import os
import tempfile

_STATIC_TMP = tempfile.mkdtemp(prefix="pm-static-")
os.environ["STATIC_DIR"] = _STATIC_TMP
with open(os.path.join(_STATIC_TMP, "index.html"), "w") as f:
    f.write("<h1>Kanban Studio</h1>")

_DB_TMP_DIR = tempfile.mkdtemp(prefix="pm-db-")
os.environ["DATABASE_PATH"] = os.path.join(_DB_TMP_DIR, "app.db")
