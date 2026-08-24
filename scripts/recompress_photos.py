"""Re-compress photos in public/photos (overwrite in place).
Longest edge 1200, quality 80, keep .webp to avoid touching site code.
"""
import os, glob
from PIL import Image

ROOT = r"E:/woekbuddy  ai/2026-07-19-18-50-25/public/photos"
TARGET = 800

def compress(path):
    im = Image.open(path)
    w, h = im.size
    long_edge = max(w, h)
    if long_edge > TARGET:
        if w >= h:
            new_w = TARGET
            new_h = int(h * TARGET / w)
        else:
            new_h = TARGET
            new_w = int(w * TARGET / h)
        im = im.resize((new_w, new_h), Image.LANCZOS)
    if im.mode not in ("RGB",):
        im = im.convert("RGB")
    im.save(path, "WEBP", quality=80, method=6)

count = 0
total_bytes_in = 0
total_bytes_out = 0
for d in sorted(os.listdir(ROOT)):
    full = os.path.join(ROOT, d)
    if not os.path.isdir(full):
        continue
    for f in os.listdir(full):
        if not f.lower().endswith(".webp"):
            continue
        p = os.path.join(full, f)
        before = os.path.getsize(p)
        total_bytes_in += before
        try:
            compress(p)
            after = os.path.getsize(p)
            total_bytes_out += after
            count += 1
        except Exception as e:
            print("ERR", p, e)
        if count % 50 == 0:
            print(f"...{count} done")
print(f"\nDone {count} files")
print(f"in {total_bytes_in/1024/1024:.1f} MB  ->  out {total_bytes_out/1024/1024:.1f} MB  ({(1-total_bytes_out/total_bytes_in)*100:.0f}% smaller)")
