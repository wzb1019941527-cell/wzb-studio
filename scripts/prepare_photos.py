"""
WZB Studio — 项目摄影批处理脚本
从 E:/...wzb项目摄影 下各项目的「成片子文件夹」中均匀采样 ≤9 张，
压成 WebP（最长边 2000px / quality 82），输出到 public/photos/<slug>/NN.webp。
Vite 的 public 目录会在 build 时原样拷贝到 dist/，运行时以 /photos/<slug>/NN.webp 引用。

用法：
  managed python 运行本脚本            # 重新压图并写 manifest
  managed python 本脚本 --manifest-only # 只扫描已输出的 WebP 写 manifest，不重新压图
PROJECTS 列表可扩展到全部 21 个项目；扩展后跑一次即可。
"""
import json
import argparse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(r"E:/11111111111111111   wzb项目摄影")
DST = ROOT / "public" / "photos"
MANIFEST = ROOT / "src" / "data" / "archiveManifest.json"
MAX_EDGE = 2000
QUALITY = 82
PER = 9  # 每个项目最多取 9 张（任务书要求 5–9）

# slug / 显示名 / 城市 / 源文件夹 / 成片子文件夹
PROJECTS = [
    {"slug": "beijing-longhu",      "name": "北京龙湖下跃",            "city": "BEIJING",
     "folder": "摄影-wzb北京龙湖下跃",            "sub": "修好的图"},
    {"slug": "shenzhen-zhongzhou-1", "name": "深圳中洲画廊 · 第一次展览", "city": "SHENZHEN",
     "folder": "摄影-wzb深圳中洲画廊 第一次展览", "sub": "成品图"},
    {"slug": "jiangyin-173",        "name": "江阴 173",                   "city": "JIANGYIN",
     "folder": "摄影-wzb江阴173",                  "sub": "成"},
    {"slug": "yangzhou-143",        "name": "龙湖扬州 143 户型",         "city": "YANGZHOU",
     "folder": "摄影-wzb龙湖扬州143户型",         "sub": "朋友圈九张图 摄影师修好"},
]

EXTS = {".jpg", ".jpeg", ".png"}


def load(img: Image.Image) -> Image.Image:
    try:
        return ImageOps.exif_transpose(img)
    except Exception:
        return img


def emit_manifest() -> None:
    """扫描已输出的 WebP，写出每个 slug 的尺寸清单，供前端做不规则排版。"""
    manifest: dict[str, list[dict]] = {}
    if not DST.exists():
        print("[manifest] 未找到 public/photos，跳过")
        return
    for slug_dir in sorted(DST.iterdir()):
        if not slug_dir.is_dir():
            continue
        items = []
        for f in sorted(slug_dir.glob("*.webp")):
            with Image.open(f) as im:
                w, h = im.size
            items.append({"f": f.name, "w": w, "h": h})
        if items:
            manifest[slug_dir.name] = items
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[manifest] 已写出 {len(manifest)} 个项目 -> {MANIFEST}")


def main() -> None:
    total = 0
    for p in PROJECTS:
        src = SRC / p["folder"] / p["sub"]
        out = DST / p["slug"]
        out.mkdir(parents=True, exist_ok=True)
        if not src.exists():
            print(f"[跳过] {p['name']}: 源不存在 -> {src}")
            continue
        files = sorted(
            f for f in src.iterdir()
            if f.is_file() and f.suffix.lower() in EXTS
        )
        if not files:
            print(f"[空]   {p['name']}: 0 张")
            continue
        n = min(PER, len(files))
        if len(files) > n:
            step = len(files) / n
            picks = [files[int(i * step)] for i in range(n)]
        else:
            picks = files
        for i, f in enumerate(picks, 1):
            im = load(Image.open(f))
            im = im.convert("RGB")
            im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
            im.save(out / f"{i:02d}.webp", "WEBP", quality=QUALITY, method=6)
        total += len(picks)
        print(f"[OK]   {p['name']:<22} 源 {len(files):>3} 张 -> 取 {len(picks)} 张 -> {out}")
    emit_manifest()
    print(f"\n=== 合计处理 {total} 张 ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WZB Studio 项目摄影批处理")
    parser.add_argument(
        "--manifest-only",
        action="store_true",
        help="只扫描已输出的 WebP 重写 manifest.json，不重新压图",
    )
    args = parser.parse_args()
    if args.manifest_only:
        emit_manifest()
    else:
        main()
