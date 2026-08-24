"""
迁移脚本：把桌面「个人网站所需资料」整合进 public/photos，并生成 manifest。

处理：
  · 过往项目照片 (17 个项目)  -> public/photos/p01..p17  + src/data/projectsManifest.json
  · 城市摄影/北京 (13 张)     -> public/photos/city/beijing + public/photos/city/cityManifest.json
  · 艺术作品类 (13 件)        -> public/photos/art/01..13.webp (Artworks.tsx 硬编码引用)
  · 个人形象照 (6 张)         -> public/photos/portraits/all + public/photos/portraits/portraitsManifest.json

统一：EXIF 方向校正 (exif_transpose) + 长边缩放到目标尺寸 + webp q82。
"""
import json
import re
import shutil
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(r"C:/Users/wzb/Desktop/个人网站所需资料")
DST = Path(r"E:/woekbuddy  ai/2026-07-19-18-50-25/public/photos")

WEBP_QUALITY = 82

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}


def natural_key(name: str):
    """数字按数值排序，其余按字符串。"""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def list_images(folder: Path):
    if not folder.exists():
        return []
    return sorted(
        (p for p in folder.iterdir() if p.suffix.lower() in IMG_EXTS and p.is_file()),
        key=lambda p: natural_key(p.name),
    )


def encode_image(src: Path, out: Path, longest: int):
    """转码单张：EXIF 校正 + 缩放到长边 longest + 存 webp。返回 (w, h)。"""
    out.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        w, h = im.size
        if max(w, h) > longest:
            scale = longest / max(w, h)
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        im.save(out, "WEBP", quality=WEBP_QUALITY, method=4)
        return im.size


def process_cases():
    """17 个项目 -> p01..p17 + projectsManifest.json"""
    root = SRC / "过往项目照片"
    folders = [p for p in root.iterdir() if p.is_dir()]
    # 按文件夹名前导数字排序
    def num(p):
        m = re.match(r"(\d+)", p.name)
        return int(m.group(1)) if m else 999
    folders.sort(key=num)

    manifest = {}
    for f in folders:
        n = num(f)
        slug = f"p{n:02d}"
        dest = DST / slug
        dest.mkdir(parents=True, exist_ok=True)
        imgs = list_images(f)
        recs = []
        for i, src in enumerate(imgs, start=1):
            out = dest / f"{i:02d}.webp"
            w, h = encode_image(src, out, longest=2000)
            recs.append({"f": out.name, "w": w, "h": h})
        manifest[slug] = recs
        print(f"[cases] {slug} <- {f.name}: {len(recs)} 张")

    (Path(r"E:/woekbuddy  ai/2026-07-19-18-50-25/src/data/projectsManifest.json")).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[cases] manifest 写入，共 {len(manifest)} 个项目")


def process_city():
    """城市摄影/北京 -> city/beijing + cityManifest.json (仅北京有图，其余 7 城占位)"""
    src = SRC / "城市摄影" / "北京"
    dest = DST / "city" / "beijing"
    # 清掉旧 th 子目录（新 manifest 不再用 th/）
    th = dest / "th"
    if th.exists():
        shutil.rmtree(th)
    imgs = list_images(src)
    recs = []
    for i, s in enumerate(imgs, start=1):
        out = dest / f"{i:02d}.webp"
        w, h = encode_image(s, out, longest=2000)
        recs.append({"f": out.name, "w": w, "h": h, "thumb": out.name})
    manifest = {
        "beijing": {
            "city": "北京",
            "en": "BEIJING",
            "place": "北京 · 2022–2024",
            "year": "2022–2024",
            "items": recs,
        }
    }
    (DST / "city" / "cityManifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[city] 北京: {len(recs)} 张 -> cityManifest.json")


def process_art():
    """艺术作品类 -> art/01..13.webp (Artworks.tsx 硬编码 /photos/art/NN.webp)"""
    src = SRC / "艺术作品类"
    dest = DST / "art"
    dest.mkdir(parents=True, exist_ok=True)
    imgs = list_images(src)
    for i, s in enumerate(imgs, start=1):
        out = dest / f"{i:02d}.webp"
        w, h = encode_image(s, out, longest=1600)
        print(f"[art] {out.name} <- {s.name} ({w}x{h})")
    print(f"[art] 共 {len(imgs)} 件")


def process_portraits():
    """个人形象照 -> portraits/all + portraitsManifest.json"""
    src = SRC / "个人形象照"
    dest = DST / "portraits" / "all"
    dest.mkdir(parents=True, exist_ok=True)
    imgs = list_images(src)
    recs = []
    for i, s in enumerate(imgs, start=1):
        out = dest / f"{i:02d}.webp"
        w, h = encode_image(s, out, longest=1600)
        recs.append({"f": out.name, "w": w, "h": h})
    manifest = {"all": recs}
    (DST / "portraits" / "portraitsManifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[portraits] 共 {len(recs)} 张 -> portraitsManifest.json")


if __name__ == "__main__":
    process_cases()
    process_city()
    process_art()
    process_portraits()
    print("=== 迁移完成 ===")
