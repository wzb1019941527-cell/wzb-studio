#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
批量压图：把桌面「个人网站所需资料」转成可上线的 webp。
  - 艺术作品类  -> public/photos/art/01..13.webp   (固定顺序，匹配 Artworks.tsx 的 ITEMS)
  - 过往项目照片 -> public/photos/{slug}/NN.webp      (每个项目一个目录)
  - 生成 src/data/projectsManifest.json  -> { slug: [{f,w,h}] }
参数：最大边 1600px，质量 85，method=6。
"""
import os, re, json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC  = Path(r"C:\Users\wzb\Desktop\个人网站所需资料")
OUT  = ROOT / "public" / "photos"
MANI = ROOT / "src" / "data" / "projectsManifest.json"

MAX_EDGE = 1600
QUALITY  = 85

# ── 艺术作品类：固定顺序，标题/归属由前端 ITEMS 维护，这里只管压图编号 ──
ART_FILES = [
    "漆画 《春作》王志斌 6060cm 漆 2015年建筑艺术设计学院.jpg",
    "玻璃艺术.JPG",
    "玻璃艺术2.JPG",
    "玻璃艺术3.JPG",
    "玻璃艺术4.JPG",
    "玻璃艺术5.JPG",
    "玻璃艺术6.JPG",
    "玻璃艺术7.JPG",
    "纤维软雕塑作品.jpg",
    "田中一光 1~2  新.jpg",
    "田中一光 3~4  新.jpg",
    "523d8e28fedd0360ae1e97315082dbd2.jpg",
    "93e94c359a6c466ba2e7a1020d7c1e8e.jpg",
]

# ── 项目文件夹 -> slug 映射（用子串匹配，规避中文/空格/双空格差异） ──
PROJECT_MAP = [
    ("东莞沙田",        "dongguan-shatian"),
    ("御湖境",          "beijing-yuhujing"),
    ("西红门129",       "beijing-xihongmen129"),
    ("北京龙湖下跃",     "beijing-longhu"),
    ("太原金地",        "taiyuan-jindi"),
    ("常熟合院",        "changshu-heyuan"),
    ("广州侨鑫",        "guangzhou-qiaoxin"),
    ("成都国贸",        "chengdu-guomao"),
    ("绵阳100",         "chengdu-mianyang100"),
    ("济南金地162",      "jinan-jindi162"),
    ("济南金地235",      "jinan-jindi235"),
    ("中洲画廊",        "shenzhen-zhongzhou-1", "第一次"),  # (key, slug, must_include)
    ("中洲画廊",        "shenzhen-zhongzhou-2", "第二次"),
    ("福州龙湖商墅",     "fuzhou-longshu"),
    ("扬州143",         "yangzhou-143"),
]


def compress(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if max(w, h) > MAX_EDGE:
        scale = MAX_EDGE / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=QUALITY, method=6)
    return im.size


def natural_key(name: str):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def build_art():
    art_dir = SRC / "艺术作品类"
    out_dir = OUT / "art"
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, fname in enumerate(ART_FILES, start=1):
        src = art_dir / fname
        if not src.exists():
            print(f"  ! 缺艺术图: {fname}")
            continue
        dst = out_dir / f"{i:02d}.webp"
        w, h = compress(src, dst)
        print(f"  art/{i:02d}.webp  {w}x{h}  <- {fname}")


def build_projects():
    proj_root = SRC / "过往项目照片"
    manifest = {}
    for folder in sorted(proj_root.iterdir()):
        if not folder.is_dir():
            continue
        name = folder.name
        slug = None
        for m in PROJECT_MAP:
            if m[0] in name and (len(m) < 3 or m[2] in name):
                slug = m[1]
                break
        if not slug:
            print(f"  ? 未匹配项目文件夹: {name} (跳过)")
            continue
        files = [f for f in folder.iterdir()
                 if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")]
        files.sort(key=lambda f: natural_key(f.name))
        out_dir = OUT / slug
        recs = []
        for i, src in enumerate(files, start=1):
            dst = out_dir / f"{i:02d}.webp"
            w, h = compress(src, dst)
            recs.append({"f": f"{i:02d}.webp", "w": w, "h": h})
        manifest[slug] = recs
        print(f"  {slug}: {len(recs)} 张 -> {out_dir}")
    MANI.parent.mkdir(parents=True, exist_ok=True)
    MANI.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  manifest 已写入: {MANI}  ({len(manifest)} 个项目)")


if __name__ == "__main__":
    print("== 压缩艺术作品类 ==")
    build_art()
    print("\n== 压缩过往项目照片 ==")
    build_projects()
    print("\n完成。")
