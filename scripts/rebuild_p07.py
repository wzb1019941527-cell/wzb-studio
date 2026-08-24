"""
只重做 p07（北京西红门129）这一个项目：
  · 清空 public/photos/p07 下所有旧 webp
  · 用桌面源文件夹当前 13 张 jpg 重新转码（EXIF 校正 + 长边2000 + webp q82）
  · 更新 src/data/projectsManifest.json 中 p07 的记录
"""
import json
import re
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(r"C:/Users/wzb/Desktop/个人网站所需资料/过往项目照片/7摄影-wzb北京西红门129")
DST = Path(r"E:/woekbuddy  ai/2026-07-19-18-50-25/public/photos/p07")
MANIFEST = Path(r"E:/woekbuddy  ai/2026-07-19-18-50-25/src/data/projectsManifest.json")
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
QUALITY = 82
LONGEST = 2000


def natural_key(name: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def list_images(folder: Path):
    return sorted(
        (p for p in folder.iterdir() if p.suffix.lower() in IMG_EXTS and p.is_file()),
        key=lambda p: natural_key(p.name),
    )


def encode(src: Path, out: Path):
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        w, h = im.size
        if max(w, h) > LONGEST:
            sc = LONGEST / max(w, h)
            im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        im.save(out, "WEBP", quality=QUALITY, method=4)
        return im.size


# 1) 清空旧 webp
for old in DST.glob("*.webp"):
    old.unlink()
print(f"[p07] 已清空旧 webp, 剩余文件: {len(list(DST.iterdir()))}")

# 2) 转码新图
imgs = list_images(SRC)
print(f"[p07] 源图 {len(imgs)} 张: {[p.name for p in imgs]}")
recs = []
for i, s in enumerate(imgs, start=1):
    out = DST / f"{i:02d}.webp"
    w, h = encode(s, out)
    recs.append({"f": out.name, "w": w, "h": h})
    print(f"   {out.name} <- {s.name} ({w}x{h})")

# 3) 更新 manifest
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["p07"] = recs
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"[p07] manifest 更新: p07 = {len(recs)} 张")
print("=== p07 重建完成 ===")
