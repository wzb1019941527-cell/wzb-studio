"""
批量压图：艺术作品类
输出: public/photos/art/  (01.webp ~ 13.webp，按语义排序)
"""

from pathlib import Path
from PIL import Image

SRC_DIR = Path(r"C:\Users\wzb\Desktop\个人网站所需资料\艺术作品类")
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "photos" / "art"

MAX_EDGE = 1600
QUALITY = 85


def sort_key(name: str) -> tuple:
    """决定艺术图展示顺序：漆画→玻璃→纤维(手工)→田中一光→珠海地图(平面)"""
    n = name
    if "漆画" in n:
        return (0, 0)
    if "玻璃艺术" in n:
        import re
        m = re.search(r"(\d+)", n)
        return (1, int(m.group(1)) if m else 0)
    if "纤维" in n:
        return (2, 0)          # 手工艺术类，紧跟玻璃
    if "田中一光" in n:
        return (3, 0)          # 平面设计类
    if "珠海地图" in n:
        return (4, 0 if "A" in n else 1)  # 平面设计类
    return (9, 0)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = [f for f in SRC_DIR.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png")]
    files.sort(key=lambda f: sort_key(f.name))

    for i, src in enumerate(files, start=1):
        dst = OUT_DIR / f"{i:02d}.webp"
        img = Image.open(src).convert("RGB")
        w, h = img.size
        if max(w, h) > MAX_EDGE:
            ratio = MAX_EDGE / max(w, h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        img.save(dst, "webp", quality=QUALITY)
        print(f"  OK {i:02d}.webp ← {src.name}")

    print(f"Done: {len(files)} art images → {OUT_DIR}")


if __name__ == "__main__":
    main()
