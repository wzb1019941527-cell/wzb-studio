"""批量压图：城市摄影（支持嵌套文件夹，每个含图的叶目录 = 一个 chapter）

源目录: 桌面/个人网站所需资料/城市摄影/
输出: public/photos/city/<slug>/NN.webp
同时生成: public/photos/cityManifest.json

每个 chapter 的配置在 CHAPTERS 里维护，新增城市/子章节时照着加一行即可。
"""
import json
import sys
from pathlib import Path
from PIL import Image

SRC_ROOT = Path(r"C:/Users/wzb/Desktop/个人网站所需资料/城市摄影")
OUT_ROOT = Path(r"E:/woekbuddy  ai/2026-07-19-18-50-25/public/photos/city")
MAX_EDGE = 1600
QUALITY = 85

# chapter 配置：src_rel 是相对 SRC_ROOT 的含图目录；其余为展示信息
CHAPTERS = [
    {
        "src_rel": "北京",
        "slug": "beijing",
        "city": "北京",
        "en": "BEIJING",
        "place": "北京 · 2022–2024",
        "year": "2022–2024",
    },
    {
        "src_rel": "深圳/深圳国际美术馆/展厅",
        "slug": "shenzhen-hall",
        "city": "深圳 · 国际美术馆",
        "en": "SHENZHEN MUSEUM · HALL",
        "place": "深圳 · 2025",
        "year": "2025",
    },
    {
        "src_rel": "深圳/深圳国际美术馆/艺术品",
        "slug": "shenzhen-art",
        "city": "深圳 · 国际美术馆",
        "en": "SHENZHEN MUSEUM · ARTWORKS",
        "place": "深圳 · 2025",
        "year": "2025",
    },
]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".jpf", ".jpx", ".tif", ".tiff", ".bmp", ".gif"}


def compress_one(src: Path, dst: Path) -> tuple[int, int]:
    img = Image.open(src)
    img = img.convert("RGB")  # 去掉透明/色彩配置差异
    w, h = img.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
    else:
        nw, nh = w, h
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=QUALITY, method=4)
    return nw, nh


def main() -> int:
    manifest = {}
    for ch in CHAPTERS:
        src_dir = SRC_ROOT / ch["src_rel"]
        out_dir = OUT_ROOT / ch["slug"]
        files = sorted(
            [p for p in src_dir.iterdir() if p.suffix.lower() in IMG_EXTS],
            key=lambda p: p.name.lower(),
        )
        if not files:
            print(f"[skip] {ch['src_rel']} 无图片")
            continue
        items = []
        for i, f in enumerate(files, start=1):
            dst = out_dir / f"{i:02d}.webp"
            w, h = compress_one(f, dst)
            items.append({"f": dst.name, "w": w, "h": h})
        manifest[ch["slug"]] = {
            "city": ch["city"],
            "en": ch["en"],
            "place": ch["place"],
            "year": ch["year"],
            "items": items,
        }
        print(f"[ok] {ch['slug']}: {len(items)} 张 -> {out_dir}")

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUT_ROOT / "cityManifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"\n完成，共 {len(manifest)} 个 chapter")
    return 0


if __name__ == "__main__":
    sys.exit(main())
