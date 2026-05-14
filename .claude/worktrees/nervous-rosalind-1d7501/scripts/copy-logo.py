#!/usr/bin/env python3
"""Copy your logo file into images/logo.png. Run from repo root on your Mac:

  python3 scripts/copy-logo.py /path/to/CREATED_TO_INSPIRE-....png
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "images", "logo.png")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/copy-logo.py <source-image.png>")
        return 1
    src = os.path.expanduser(sys.argv[1])
    if not os.path.isfile(src):
        print("Not found:", src)
        return 1
    os.makedirs(os.path.dirname(DST), exist_ok=True)
    shutil.copy2(src, DST)
    print("Wrote", DST, "(" + str(os.path.getsize(DST)) + " bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
