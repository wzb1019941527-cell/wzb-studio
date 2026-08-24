"""
批量压图：过往项目照片（新版 — 按编号前缀 p01~p15 + 保留原始文件编号）
"""

import json
import os
import re
from pathlib import Path

from PIL import Image

# ── 路径 ──
SRC_ROOT = Path(r"C:\Users\wzb\Desktop\个人网站所需资料\过往项目照片")
OUT_ROOT = Path(__file__).resolve().parent.parent / "public" / "photos"
MANIFEST_OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "projectsManifest.json"

MAX_EDGE = 1600
QUALITY = 85
PYTHON = r"C:\Users\wzb\.workbuddy\binaries\python\versions\3.13.12\python.exe"


def compress_one(src: Path, dst: Path) -> tuple[int, int]:
    img = Image.open(src)
    has_alpha = img.mode == "RGBA"
    if has_alpha:
        # 保留 alpha 但输出仍为 RGB (webp 支持但简化处理)
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg.convert("RGB")
    else:
        img = img.convert("RGB")
    w, h = img.size
    if max(w, h) > MAX_EDGE:
        ratio = MAX_EDGE / max(w, h)
        w, h = int(w * ratio), int(h * ratio)
        img = img.resize((w, h), Image.LANCZOS)
    img.save(dst, "webp", quality=QUALITY)
    return w, h


def main():
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    # 扫描所有子目录，按数字前缀排序
    dirs = sorted(
        [d for d in SRC_ROOT.iterdir() if d.is_dir()],
        key=lambda d: (
            int(re.match(r"^(\d+)", d.name).group(1))
            if re.match(r"^(\d+)", d.name)
            else 99
        ),
    )

    manifest: dict[str, list[dict]] = {}

    for d in dirs:
        # 从文件夹名提取编号前缀作为 slug
        m = re.match(r"^(\d+)", d.name)
        if not m:
            continue
        slug = f"p{int(m.group(1)):02d}"

        # 收集所有图片文件，按文件名中的数字排序（1.jpg 排在 2.jpg 前面）
        files = []
        for f in sorted(d.iterdir()):
            if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                # 提取文件名中的主数字作为排序键
                fm = re.match(r"^(\d+)", f.stem)
                key = int(fm.group(1)) if fm else 999
                files.append((key, f))
        files.sort(key=lambda x: x[0])

        out_dir = OUT_ROOT / slug
        out_dir.mkdir(parents=True, exist_ok=True)

        entries = []
        for idx, (_, src_file) in enumerate(files, start=1):
            dst_file = out_dir / f"{idx}.webp"
            try:
                w, h = compress_one(src_file, dst_file)
                entries.append({"f": f"{idx}.webp", "w": w, "h": h})
                print(f"  OK {slug}/{idx}.webp ({w}x{h}) ← {src_file.name}")
            except Exception as e:
                print(f"  FAIL {src_file.name}: {e}")

        manifest[slug] = entries
        print(f"  {slug}: {len(entries)} images\n")

    with open(MANIFEST_OUT, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"Manifest → {MANIFEST_OUT} ({len(manifest)} projects)")


if __name__ == "__main__":
    main()
