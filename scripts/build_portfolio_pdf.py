#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WZB Studio —— 暗色 · 横构图 · 有序大牌杂志风作品集 PDF（Landscape A4）

设计原则（有序 / 大牌）：
- 一套统一母版网格：页眉 + 大号项目编号(01..17) + 图片画板(带细框) + 文字栏 + 页脚标尺
- 仅按固定规则(奇偶页)左右镜像，形成有序的左右翻页节奏，而非每页乱跳
- 统一字体/配色/留白：Syne(标题) / Space Mono(标签) / Inter(正文) / STSong-Light(中文)
- 配色与网页 @theme 对齐：近黑底 #0a0a0a + 暖白 #f5f3ef + 陶土 #b06a4f + 卡其 #9c8a72
"""
import io
import json
import os

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "scripts", "portfolio_data.json")
MANIFEST = os.path.join(ROOT, "src", "data", "projectsManifest.json")
FONTS = os.path.join(ROOT, "scripts", "fonts")
OUT = os.path.join(ROOT, "dist_portfolio", "WZB_Studio_Portfolio.pdf")

# ── 页面（横构图 A4）──
PW, PH = int(A4[1]), int(A4[0])  # 842 x 595  (landscape)
ML, MR, MT, MB = 56, 56, 56, 56
CW = PW - ML - MR              # 内容宽 730
TOP = PH - MT                  # 内容顶 539
BOT = MB                       # 内容底 56

# ── 配色（与网页 @theme 对齐）──
PAPER = HexColor("#0a0a0a")
BONE = HexColor("#f5f3ef")
CLAY = HexColor("#b06a4f")
KHAKI = HexColor("#9c8a72")
SAND = HexColor("#c9b89c")
LINE = HexColor("#262626")
STORY_EN = HexColor("#d9d4c9")
STORY_CN = HexColor("#b3aca0")
FRAME = HexColor("#3a3a3a")

# ── 字体注册 ──
pdfmetrics.registerFont(TTFont("SyneR", os.path.join(FONTS, "syne400.ttf")))   # Regular (秀气封面)
pdfmetrics.registerFont(TTFont("SyneM", os.path.join(FONTS, "syne500.ttf")))   # Medium
pdfmetrics.registerFont(TTFont("SyneB", os.path.join(FONTS, "syne700.ttf")))
pdfmetrics.registerFont(TTFont("SyneX", os.path.join(FONTS, "syne800.ttf")))
pdfmetrics.registerFont(TTFont("Mono", os.path.join(FONTS, "spacemono400.ttf")))
pdfmetrics.registerFont(TTFont("MonoB", os.path.join(FONTS, "spacemono700.ttf")))
pdfmetrics.registerFont(TTFont("Inter", os.path.join(FONTS, "inter400.ttf")))
pdfmetrics.registerFont(TTFont("InterL", os.path.join(FONTS, "inter300.ttf")))
pdfmetrics.registerFont(TTFont("InterM", os.path.join(FONTS, "inter500.ttf")))
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
CJK = "STSong-Light"


# ── 图片预处理 ──
def prep_image(src, longest=1600):
    im = PILImage.open(src)
    ow, oh = im.size
    im = im.convert("RGB")
    s = longest / max(ow, oh)
    if s < 1:
        im = im.resize((int(ow * s), int(oh * s)), PILImage.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=87, optimize=True)
    return buf.getvalue(), ow, oh


def prep_cover(src, bw, bh):
    """裁剪到目标宽高比并精确缩放到 (bw,bh)，用于满版图不拉伸。"""
    im = PILImage.open(src).convert("RGB")
    iw, ih = im.size
    tgt = bw / bh
    cur = iw / ih
    if cur > tgt:
        nw = int(ih * tgt)
        im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = int(iw / tgt)
        im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    im = im.resize((bw, bh), PILImage.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=84, optimize=True)
    return buf.getvalue()


def contain_rect(ow, oh, max_w, max_h, x, y_top):
    r = min(max_w / ow, max_h / oh)
    w, h = ow * r, oh * r
    x0 = x + (max_w - w) / 2
    y0 = y_top - h
    return x0, y0, w, h


def draw_img(c, blob, rect):
    x0, y0, w, h = rect
    c.drawImage(ImageReader(io.BytesIO(blob)), x0, y0, w, h)
    # 细框：有序的"画板"质感
    c.saveState()
    c.setFillAlpha(0.35)
    c.setStrokeColor(CLAY)
    c.setLineWidth(0.6)
    c.rect(x0, y0, w, h, fill=0, stroke=1)
    c.restoreState()


def draw_cover(c, blob, x, y, w, h):
    c.drawImage(ImageReader(io.BytesIO(blob)), x, y, w, h)


# ── 手动断行 + drawString：中英混排，视觉顶精确可控 ──
def _is_cjk(ch):
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF) or (0x3000 <= cp <= 0x303F) or \
           (0xFF00 <= cp <= 0xFFEF) or (0xAC00 <= cp <= 0xD7AF)


def draw_wrapped(c, text, font_en, font_cjk, size, color, x, y_top, max_w, leading_mul=1.35):
    """在视觉顶 y_top 处向下绘制自动断行的混排文本；返回该块占用高度。"""
    # 1) 分词为 (font, token)
    tokens = []
    parts = text.split(' ')
    for idx, part in enumerate(parts):
        if not part:
            continue
        i = 0
        while i < len(part):
            ch = part[i]
            if _is_cjk(ch):
                tokens.append((font_cjk, ch)); i += 1
            else:
                j = i
                while j < len(part) and not _is_cjk(part[j]):
                    j += 1
                tokens.append((font_en, part[i:j])); i = j
        if idx < len(parts) - 1:
            tokens.append((font_en, ' '))
    # 2) 贪心断行
    lines = []
    cur, cur_w = [], 0.0
    for fnt, s in tokens:
        if s == ' ' and not cur:
            continue
        tw = c.stringWidth(s, fnt, size)
        if not cur or cur_w + tw <= max_w:
            cur.append((fnt, s)); cur_w += tw
        else:
            lines.append(cur)
            if s == ' ':
                cur, cur_w = [], 0.0
            else:
                cur = [(fnt, s)]; cur_w = tw
    if cur:
        lines.append(cur)
    # 3) 绘制
    leading = size * leading_mul
    c.setFillColor(color)
    y = y_top - size * 0.78  # 首行基线
    for line in lines:
        while line and line[-1][1].strip() == '':
            line.pop()
        cx = x
        for fnt, s in line:
            c.setFont(fnt, size)
            c.drawString(cx, y, s)
            cx += c.stringWidth(s, fnt, size)
        y -= leading
    # 块占用高度（视觉顶 → 末行视觉底）
    return size + (len(lines) - 1) * leading


# ── 刊头 / 页脚（统一页具）──
def masthead(c, location):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(ML, 552, PW - MR, 552)
    c.setFillColor(KHAKI)
    c.setFont("MonoB", 8)
    c.drawString(ML, 560, "WZB STUDIO")
    c.setFillColor(KHAKI)
    c.setFont("Mono", 8)
    c.drawRightString(PW - MR, 560, location.upper())


def footer(c, page_no, total):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(ML, 42, PW - MR, 42)
    x, i = ML, 0
    while x <= PW - MR:
        long = (i % 5 == 0)
        c.setStrokeColor(CLAY if long else LINE)
        c.setLineWidth(0.6)
        c.line(x, 42, x, 42 - (7 if long else 3))
        x += 28
        i += 1
    c.setFillColor(CLAY)
    c.rect(PW / 2 - 1, 44, 2, 6, fill=1, stroke=0)
    c.setFillColor(KHAKI)
    c.setFont("MonoB", 8)
    c.drawString(ML, 30, "WZB STUDIO")
    c.setFillColor(BONE)
    c.setFont("Mono", 8)
    c.drawRightString(PW - MR, 30, f"PAGE {page_no:02d} / {total:02d}")


def bg(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)


def draw_mixed(c, x, y, cn, sep, latin, size=10):
    """先画中文（CJK 字体），再接拉丁/数字（Mono），保证中文不丢字。"""
    c.setFillColor(KHAKI)
    c.setFont(CJK, size)
    c.drawString(x, y, cn + sep)
    w = c.stringWidth(cn + sep, CJK, size)
    c.setFillColor(BONE)
    c.setFont("Mono", size)
    c.drawString(x + w, y, latin)


# ── 统一母版：有序跨页（仅左右镜像）──
W_TXT, GUT = 286, 48
W_IMG = PW - ML - MR - W_TXT - GUT   # 396
IMG_TOP = 524
TXT_TOP = 524

# 多图布局规格（所有图等大，整体更撑满图片列）
# 设计目标：图片列总高不超过 IMG_AREA_MAX_H，行间距 14，使排版有杂志摄影集的重感
IMG_AREA_MAX_H = 430   # 单图最大可用高（图片列顶部 524 -> 底部 >= 94，给 caption+footer 留空间）
LAYOUTS = {
    # 单图：撑满
    "1":         {"main_h": 420, "below_h": 0,   "row_n": 0, "row_gap": 14},
    # 1+1：上下两张同大
    "1+1":       {"main_h": 200, "below_h": 200, "row_n": 1, "row_gap": 14},
    # 1+2：上 1 大 + 下 2 张同大（横排）
    "1+2":       {"main_h": 230, "below_h": 170, "row_n": 2, "row_gap": 14},
    # 1+3：上 1 大 + 下 3 张同大（横排）
    "1+3":       {"main_h": 210, "below_h": 160, "row_n": 3, "row_gap": 12},
    # 叠层：保留原 2-overlap（杂志撕页感）
    "2-overlap": {"main_h": 260, "below_h": 200, "row_n": 0, "row_gap": 14, "overlap": True},
}


def _draw_caption(c, p, x_left, y_baseline):
    c.setFillColor(CLAY)
    c.setFont("Mono", 8.5)
    c.drawString(x_left, y_baseline, f"FIG. {int(p['index']):02d}  —  {p['en']}")


def _render_images(c, p, imgs, ix, layout):
    """根据 layout 在图片列 ix 渲染多图，返回 (caption_x, caption_y)。"""
    cfg = LAYOUTS.get(layout, LAYOUTS["1"])
    main_h = cfg["main_h"]

    if layout == "2-overlap":
        # 后图（大） + 前图（小，错位）
        blob0, ow0, oh0 = imgs[0]
        r0 = contain_rect(ow0, oh0, W_IMG, cfg["main_h"], ix, IMG_TOP)
        draw_img(c, blob0, r0)
        if len(imgs) > 1:
            blob1, ow1, oh1 = imgs[1]
            # 前图窄一些，水平居中偏右，纵向从 r0 底部往上覆盖 36px
            front_w = W_IMG - 60
            front_top = r0[1] + 36
            r1 = contain_rect(ow1, oh1, front_w, cfg["below_h"], ix + 30, front_top)
            draw_img(c, blob1, r1)
            cap_y = min(r0[1], r1[1]) - 14
        else:
            cap_y = r0[1] - 14
        return ix, cap_y

    # 1 / 1+1 / 1+2 / 1+3 —— 主图 + 可选下方行
    blob, ow, oh = imgs[0]
    main_rect = contain_rect(ow, oh, W_IMG, main_h, ix, IMG_TOP)
    draw_img(c, blob, main_rect)

    below_top = main_rect[1] - cfg["row_gap"]     # 下方行顶部
    bottom_y = main_rect[1]                          # 主图底部（最远延伸）

    n = cfg["row_n"]
    if n >= 1 and len(imgs) >= n + 1:
        # 计算每格宽度
        gap = cfg["row_gap"]
        cell_w = (W_IMG - gap * (n - 1)) / n
        for k in range(n):
            blob_k, ow_k, oh_k = imgs[k + 1]
            x = ix + k * (cell_w + gap)
            r = contain_rect(ow_k, oh_k, cell_w, cfg["below_h"], x, below_top)
            draw_img(c, blob_k, r)
            bottom_y = min(bottom_y, r[1])

    cap_y = bottom_y - 14
    return ix, cap_y


def tpl_spread(c, p, imgs, page_no, total, nproj, side):
    masthead(c, p["location"])
    layout = p.get("layout", "1")

    if side == "right":
        tx, ix = ML, ML + W_TXT + GUT
    else:
        ix, tx = ML, ML + W_IMG + GUT

    cap_x, cap_y = _render_images(c, p, imgs, ix, layout)
    _draw_caption(c, p, cap_x, cap_y)

    # ── 文字栏：draw_wrapped 精确控制视觉顶，自上而下有序堆叠 ──
    y = TXT_TOP
    # 1) 大号编号（drawString，无断行）
    c.setFillColor(CLAY)
    c.setFont("SyneX", 58)
    c.drawString(tx, y - 58 * 0.78, f"{int(p['index']):02d}")
    y -= 58 + 20
    # 2) 英文标题
    h = draw_wrapped(c, p["en"], "SyneB", CJK, 19, BONE, tx, y, W_TXT, 1.18)
    y -= h + 12
    # 3) 中文标题
    h = draw_wrapped(c, p["title"], "Inter", CJK, 11, SAND, tx, y, W_TXT, 1.5)
    y -= h + 12
    # 4) meta
    h = draw_wrapped(c, f"{p['year']}  ·  {p['location']}", "Mono", CJK,
                     8.5, KHAKI, tx, y, W_TXT, 1.45)
    y -= h + 14
    # 5) tags
    h = draw_wrapped(c, " / ".join(t.upper() for t in p["tags"]),
                     "Mono", CJK, 8, CLAY, tx, y, W_TXT, 1.4)
    y -= h + 16
    # 6) 细线
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(tx, y - 4, tx + 72, y - 4)
    y -= 12 + 16
    # 7) 故事 EN
    h = draw_wrapped(c, p["storyEn"], "InterL", CJK, 8.4, STORY_EN,
                     tx, y, W_TXT, 1.6)
    y -= h + 8
    # 8) 故事 CN
    draw_wrapped(c, p["storyCn"], "InterL", CJK, 8.2, STORY_CN,
                 tx, y, W_TXT, 1.85)

    footer(c, page_no, total)


def build():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)

    projects = data["projects"]
    nproj = len(projects)
    total = nproj + 2  # 封面 + 项目 + 联系

    # 预取每个项目的图片路径与字节
    for p in projects:
        slug = p["slug"]
        entries = manifest.get(slug, [])
        n_want = p.get("nImages", 1)
        paths = []
        for e in entries[:n_want]:
            fp = os.path.join(ROOT, "public", "photos", slug, e["f"])
            if os.path.exists(fp):
                paths.append(fp)
        p["_paths"] = paths
        p["_imgs"] = [prep_image(pp, 1600) for pp in paths]

    c = canvas.Canvas(OUT, pagesize=(PW, PH))

    # ── 封面（对齐同一网格）──
    bg(c)
    cover_fp = projects[2]["_paths"][0] if (len(projects) > 2 and projects[2]["_paths"]) else projects[0]["_paths"][0]
    draw_cover(c, prep_cover(cover_fp, PW, PH), 0, 0, PW, PH)
    c.setFillColor(PAPER)
    c.setFillAlpha(0.40)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    c.setFillAlpha(0.62)
    c.rect(0, 0, PW, 250, fill=1, stroke=0)
    c.setFillAlpha(1)

    # 顶部刊头（与内页统一）
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(ML, 552, PW - MR, 552)
    c.setFillColor(KHAKI)
    c.setFont("MonoB", 8)
    c.drawString(ML, 560, "WZB STUDIO")
    c.setFillColor(KHAKI)
    c.setFont("Mono", 9)
    c.drawRightString(PW - MR, 560, "SELECTED WORKS · 2021—2026")

    # 主字标（左对齐网格）—— 秀气版：Medium 字重 + 字距 + 略小
    c.setFillColor(BONE)
    c.setFont("SyneM", 118)
    x = ML
    for ch in "WZB":
        c.drawString(x, 380, ch)
        x += c.stringWidth(ch, "SyneM", 118) + 22   # 22px 字距
    c.setFillColor(CLAY)
    c.setFont("MonoB", 11)
    c.drawString(ML + 6, 350, "S T U D I O")
    c.setFillColor(SAND)
    c.setFont("InterM", 13)
    c.drawString(ML + 6, 326, data["tagline"])

    # 底部分隔 + 联系（置于页脚之上，统一对齐）
    c.setStrokeColor(CLAY)
    c.setLineWidth(1)
    c.line(ML, 118, ML + 360, 118)
    ct = data["contact"]
    c.setFillColor(BONE)
    c.setFont("Mono", 10)
    c.drawString(ML, 100, ct["email"])
    draw_mixed(c, ML, 82, "微信 / 电话", "  ·  ", ct["phone"])
    draw_mixed(c, ML, 64, "小红书", "  ·  ", ct["xiaohongshu"])
    footer(c, 1, total)
    c.showPage()

    # ── 项目页（统一母版，奇偶左右镜像）──
    for i, p in enumerate(projects):
        bg(c)
        side = "right" if i % 2 == 0 else "left"
        tpl_spread(c, p, p["_imgs"], i + 2, total, nproj, side)
        c.showPage()

    # ── 联系页 ──
    bg(c)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(ML, 552, PW - MR, 552)
    c.setFillColor(KHAKI)
    c.setFont("MonoB", 8)
    c.drawString(ML, 560, "WZB STUDIO")
    c.setFillColor(KHAKI)
    c.setFont("Mono", 8)
    c.drawRightString(PW - MR, 560, "GET IN TOUCH")

    c.setFillColor(BONE)
    c.setFont("SyneX", 46)
    c.drawCentredString(PW / 2, 330, "GET IN TOUCH")
    ct = data["contact"]
    c.setFillColor(BONE)
    c.setFont("Mono", 12)
    c.drawCentredString(PW / 2, 270, ct["email"])
    c.setFillColor(KHAKI)
    c.setFont(CJK, 12)
    c.drawCentredString(PW / 2, 246, f"微信 / 电话  ·  {ct['phone']}")
    c.drawCentredString(PW / 2, 222, f"小红书  ·  {ct['xiaohongshu']}")
    c.setFillColor(SAND)
    c.setFont("Mono", 9)
    c.drawCentredString(PW / 2, 180, "Shenzhen / China — Available Worldwide")
    c.setFillColor(KHAKI)
    c.setFont("Mono", 8)
    c.drawCentredString(PW / 2, 156, "© 2026 WZB STUDIO · ALL RIGHTS RESERVED")
    footer(c, total, total)

    c.save()
    size = os.path.getsize(OUT)
    print(f"OK -> {OUT}")
    print(f"pages={total} size={size/1024:.0f}KB")


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    build()
