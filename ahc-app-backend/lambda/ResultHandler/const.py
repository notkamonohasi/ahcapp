from pathlib import Path

TMP_DIR = Path("/tmp")

if TMP_DIR.exists() is False:
    TMP_DIR.mkdir()
