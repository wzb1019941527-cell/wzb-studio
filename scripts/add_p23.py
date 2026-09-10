"""新增 p23：「漂移」林枞个展（2026）—— jpg → webp，输出到 public/photos/p23/"""
import json, re
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\wzb\Desktop\个人网站所需资料\过往项目照片\0摄影-「漂移」 林枞个展（2026）")
OUT = Path(r"E:\woekbuddy  ai\2026-07-19-18-50-25\public\photos\p23")
MAX_EDGE = 1600
QUALITY = 85

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = []
    for f in SRC.iterdir():
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
            m = re.match(r"^(\d+)", f.stem)
            files.append((int(m.group(1)) if m else 999, f))
    files.sort(key=lambda x: x[0])

    entries = []
    for idx, (_, src) in enumerate(files, start=1):
        img = Image.open(src).convert("RGB")
        w, h = img.size
        if max(w, h) > MAX_EDGE:
            r = MAX_EDGE / max(w, h)
            w, h = int(w * r), int(h * r)
            img = img.resize((w, h), Image.LANCZOS)
        name = f"{idx:02d}.webp"
        img.save(OUT / name, "webp", quality=QUALITY)
        entries.append({"f": name, "w": w, "h": h})
        print(f"OK {name} ({w}x{h}) <- {src.name}")

    print("---JSON---")
    print(json.dumps(entries, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
