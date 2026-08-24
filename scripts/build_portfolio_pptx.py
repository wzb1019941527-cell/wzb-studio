#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WZB Studio 作品集 —— 可编辑 PPTX 生成器
风格与 PDF 一致（暗色 / 横构图 / 杂志母版），但所有元素独立可编辑：
  · 文字均为文本框（可改字、改色、拖动）
  · 图片均为独立图片框（双击可替换）
  · 背景为纯色矩形（可改底色）

依赖: python-pptx, Pillow
用法: python scripts/build_portfolio_pptx.py
输出: dist_portfolio/WZB_Studio_Portfolio.pptx  (+ dist_portfolio/assets/*.jpg)
"""
import os, json, io
from PIL import Image

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "scripts", "fonts")
ASSETS = os.path.join(ROOT, "dist_portfolio", "assets")
OUT = os.path.join(ROOT, "dist_portfolio", "WZB_Studio_Portfolio.pptx")
DATA = os.path.join(ROOT, "scripts", "portfolio_data.json")
MANIFEST = os.path.join(ROOT, "src", "data", "projectsManifest.json")

# ── 页面尺寸 16:9 ──
PW, PH = 13.333, 7.5
ML, MR = 0.6, 0.6
W_TXT, GUT = 4.3, 0.45
W_IMG = PW - ML - MR - W_TXT - GUT        # 7.383
IMG_TOP = 0.95
TXT_TOP = 0.95

# ── 调色板（对应网页 index.css）──
PAPER     = RGBColor(0x0A, 0x0A, 0x0A)
BONE      = RGBColor(0xF5, 0xF3, 0xEF)
CLAY      = RGBColor(0xB0, 0x6A, 0x4F)
KHAKI     = RGBColor(0x9C, 0x8A, 0x72)
SAND      = RGBColor(0xD7, 0xCD, 0xBE)
LINE      = RGBColor(0x3C, 0x38, 0x34)
STORY_EN  = RGBColor(0xC9, 0xC4, 0xBB)
STORY_CN  = RGBColor(0x9A, 0x93, 0x88)

DISPLAY = "Syne"     # 大标题（用户若未装会回退 Arial；要一致请装 Syne）
BODY    = "Arial"
CN      = "SimSun"   # 中文（宋体系，对应网页 Noto Serif SC）

# ── 多图布局（英寸）──
LAYOUTS = {
    "1":         {"main_h": 5.0,  "below_h": 0,   "row_n": 0, "row_gap": 0.20},
    "1+1":       {"main_h": 2.40, "below_h": 2.40, "row_n": 1, "row_gap": 0.20},
    "1+2":       {"main_h": 2.75, "below_h": 2.05, "row_n": 2, "row_gap": 0.20},
    "1+3":       {"main_h": 2.60, "below_h": 2.00, "row_n": 3, "row_gap": 0.18},
    "2-overlap": {"main_h": 2.85, "below_h": 2.15, "row_n": 0, "row_gap": 0.20, "overlap": True},
}


# ── 工具 ──
def set_run_font(run, latin, ea, size_pt, color, bold=False, italic=False):
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = latin
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:ea", "a:cs"):
        el = rPr.find(qn(tag))
        if el is None:
            el = rPr.makeelement(qn(tag), {})
            rPr.append(el)
        el.set("typeface", ea)


def blank_slide(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def bg(slide, color=PAPER):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(PW), Inches(PH))
    sh.fill.solid(); sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def add_line(slide, x1, y1, x2, y2, color, pt):
    sh = slide.shapes.add_connector(2, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    sh.line.color.rgb = color
    sh.line.width = Pt(pt)
    sh.shadow.inherit = False
    return sh


def textbox(slide, l, t, w, h):
    tb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    return tb, tf


def single_text(slide, l, t, w, h, text, latin, ea, size, color,
                bold=False, align=PP_ALIGN.LEFT, ls=1.1, anchor=MSO_ANCHOR.TOP):
    tb, tf = textbox(slide, l, t, w, h)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = ls
    r = p.add_run(); r.text = text
    set_run_font(r, latin, ea, size, color, bold)
    return tb


def multi_text(slide, l, t, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb, tf = textbox(slide, l, t, w, h)
    tf.vertical_anchor = anchor
    first = True
    for spec in lines:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = align
        p.line_spacing = spec.get("ls", 1.15)
        p.space_after = Pt(spec.get("sa", 2))
        r = p.add_run(); r.text = spec["text"]
        set_run_font(r, spec["latin"], spec["ea"], spec["size"], spec["color"], spec.get("bold", False))
    return tb


def prep_image(src, max_edge=1600):
    """webp/任意格式 -> 同目录 assets 下的 JPEG，返回 jpg 路径。"""
    os.makedirs(ASSETS, exist_ok=True)
    rel = os.path.relpath(src, ROOT).replace(os.sep, "_").rsplit(".", 1)[0] + ".jpg"
    dst = os.path.join(ASSETS, rel)
    if os.path.exists(dst):
        return dst
    im = Image.open(src).convert("RGB")
    if max(im.size) > max_edge:
        im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    im.save(dst, "JPEG", quality=88)
    return dst


def contain_rect(iw, ih, bw, bh, bx, by):
    s = min(bw / iw, bh / ih)
    w, h = iw * s, ih * s
    l = bx + (bw - w) / 2
    t = by + (bh - h) / 2
    return l, t, w, h


def add_pic(slide, jpg, l, t, w, h, frame=True):
    """contain 放入 (l,t,w,h) 画板，可选陶土细框。"""
    iw, ih = Image.open(jpg).size
    cl, ct, cw, ch = contain_rect(iw, ih, w, h, l, t)
    slide.shapes.add_picture(jpg, Inches(cl), Inches(ct), Inches(cw), Inches(ch))
    if frame:
        sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(cl), Inches(ct),
                                    Inches(cw), Inches(ch))
        sh.fill.background()
        sh.line.color.rgb = CLAY
        sh.line.width = Pt(0.75)
        sh.shadow.inherit = False
    return cl, ct, cw, ch


# ── 页眉 / 页脚 ──
def masthead(slide, idx_label):
    add_line(slide, ML, 0.55, PW - MR, 0.55, LINE, 0.75)
    single_text(slide, ML, 0.40, 4.0, 0.25, "WZB STUDIO", BODY, BODY, 9, CLAY, True)
    single_text(slide, PW - MR - 3.0, 0.40, 3.0, 0.25, idx_label, BODY, BODY, 9,
                BONE, False, PP_ALIGN.RIGHT)


def footer(slide, page_no, total):
    y = 6.85
    add_line(slide, ML, y, PW - MR, y, LINE, 0.5)
    add_line(slide, PW / 2 - 0.18, y - 0.07, PW / 2 + 0.18, y - 0.07, CLAY, 1.1)  # 中点刻度
    single_text(slide, ML, y + 0.06, 3.0, 0.25, "WZB STUDIO", BODY, BODY, 8, KHAKI, False)
    single_text(slide, PW - MR - 3.0, y + 0.06, 3.0, 0.25,
                f"page {page_no:02d} / {total:02d}", BODY, BODY, 8, KHAKI, False, PP_ALIGN.RIGHT)


# ── 图片渲染（多图）──
def render_images(slide, p, jpgs, ix, layout):
    cfg = LAYOUTS.get(layout, LAYOUTS["1"])
    cap_x, cap_y = ix, IMG_TOP + cfg["main_h"] - 0.18

    if layout == "2-overlap":
        cl, ct, cw, ch = add_pic(slide, jpgs[0], ix, IMG_TOP, W_IMG, cfg["main_h"])
        if len(jpgs) > 1:
            fw = W_IMG - 0.7
            ft = ct + ch - 0.3 - cfg["below_h"]    # 从大图底往上覆盖 0.3
            fl = ix + 0.35
            add_pic(slide, jpgs[1], fl, ft, fw, cfg["below_h"])
            cap_y = min(ct, ft) - 0.18
        return cap_x, cap_y

    # 主图
    add_pic(slide, jpgs[0], ix, IMG_TOP, W_IMG, cfg["main_h"])
    below_top = IMG_TOP + cfg["main_h"] + cfg["row_gap"]
    bottom_y = IMG_TOP + cfg["main_h"]
    n = cfg["row_n"]
    if n >= 1 and len(jpgs) >= n + 1:
        gap = cfg["row_gap"]
        cell_w = (W_IMG - gap * (n - 1)) / n
        for k in range(n):
            x = ix + k * (cell_w + gap)
            cl, ct, cw, ch = add_pic(slide, jpgs[k + 1], x, below_top, cell_w, cfg["below_h"])
            bottom_y = min(bottom_y, ct + ch)
        cap_y = bottom_y - 0.18
    return cap_x, cap_y


# ── 项目页 ──
def tpl_spread(slide, p, jpgs, page_no, total, side):
    idx_label = f"{p['index']} / {total - 2:02d}"
    masthead(slide, idx_label)
    layout = p.get("layout", "1")
    if side == "right":
        tx, ix = ML, ML + W_TXT + GUT
    else:
        ix, tx = ML, ML + W_IMG + GUT

    cap_x, cap_y = render_images(slide, p, jpgs, ix, layout)
    single_text(slide, cap_x, cap_y, W_IMG, 0.25,
                f"FIG. {int(p['index']):02d}  —  {p['en']}", BODY, BODY, 8, CLAY, False)

    # 文字栏（自上而下）
    y = TXT_TOP
    single_text(slide, tx, y, W_TXT, 0.95, f"{int(p['index']):02d}", DISPLAY, DISPLAY, 50, CLAY, True)
    y += 0.95
    single_text(slide, tx, y, W_TXT, 0.6, p["en"], DISPLAY, DISPLAY, 17, BONE, True, ls=1.05)
    y += 0.55
    single_text(slide, tx, y, W_TXT, 0.35, p["title"], CN, CN, 12, SAND, False)
    y += 0.40
    single_text(slide, tx, y, W_TXT, 0.25,
                f"{p['year']}  ·  {p['location']}", BODY, BODY, 9, KHAKI, False)
    y += 0.30
    single_text(slide, tx, y, W_TXT, 0.25,
                "  /  ".join(t.upper() for t in p["tags"]), BODY, BODY, 9, CLAY, True)
    y += 0.34
    add_line(slide, tx, y, tx + 1.0, y, LINE, 0.75)
    y += 0.20
    multi_text(slide, tx, y, W_TXT, 2.7, [
        {"text": p["storyEn"], "latin": BODY, "ea": CN, "size": 9,
         "color": STORY_EN, "ls": 1.28, "sa": 5},
        {"text": p["storyCn"], "latin": BODY, "ea": CN, "size": 9,
         "color": STORY_CN, "ls": 1.5, "sa": 0},
    ])
    footer(slide, page_no, total)


# ── 封面 ──
def draw_cover(slide, jpg, data):
    bg(slide)
    # hero 满版（cover）
    iw, ih = Image.open(jpg).size
    s = max(PW / iw, PH / ih)
    w, h = iw * s, ih * s
    l, t = (PW - w) / 2, (PH - h) / 2
    slide.shapes.add_picture(jpg, Inches(l), Inches(t), Inches(w), Inches(h))
    # 压暗
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(PW), Inches(PH))
    sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(0x00, 0x00, 0x00)
    sh.fill.transparency = 50
    sh.line.fill.background(); sh.shadow.inherit = False

    # 左侧字标
    single_text(slide, 0.7, 2.45, 9.0, 1.7, "WZB", DISPLAY, DISPLAY, 120, BONE, True, ls=0.95)
    single_text(slide, 0.78, 4.25, 9.0, 0.3, "S T U D I O", BODY, BODY, 14, CLAY, True)
    single_text(slide, 0.78, 4.62, 9.0, 0.3, data["tagline"], BODY, BODY, 14, SAND, False)
    single_text(slide, 0.78, 5.05, 9.0, 0.3,
                "SELECTED WORKS  ·  2021 — 2026", BODY, BODY, 11, KHAKI, False)

    ct = data["contact"]
    single_text(slide, 0.78, 6.05, 9.0, 0.3,
                f"微信 / 电话   ·   {ct['phone']}", CN, CN, 12, BONE, False)
    single_text(slide, 0.78, 6.38, 9.0, 0.3,
                f"小红书   ·   {ct['xiaohongshu']}", CN, CN, 12, BONE, False)
    single_text(slide, 0.78, 6.71, 9.0, 0.3,
                ct["email"], BODY, BODY, 12, BONE, False)


# ── 联系页 ──
def draw_contact(slide, data):
    bg(slide)
    add_line(slide, ML, 0.55, PW - MR, 0.55, LINE, 0.75)
    single_text(slide, ML, 0.40, 4.0, 0.25, "WZB STUDIO", BODY, BODY, 9, CLAY, True)
    single_text(slide, PW - MR - 3.0, 0.40, 3.0, 0.25,
                "18 / 18", BODY, BODY, 9, BONE, False, PP_ALIGN.RIGHT)

    single_text(slide, 0, 2.5, PW, 1.0, "GET IN TOUCH", DISPLAY, DISPLAY, 54, BONE, True,
                align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    ct = data["contact"]
    add_line(slide, PW / 2 - 1.2, 3.7, PW / 2 + 1.2, 3.7, CLAY, 0.75)
    multi_text(slide, 0, 4.0, PW, 2.0, [
        {"text": ct["email"], "latin": BODY, "ea": CN, "size": 16, "color": SAND, "ls": 1.4, "sa": 8},
        {"text": f"微信 / 电话   ·   {ct['phone']}", "latin": CN, "ea": CN, "size": 14, "color": BONE, "ls": 1.4, "sa": 4},
        {"text": f"小红书   ·   {ct['xiaohongshu']}", "latin": CN, "ea": CN, "size": 14, "color": BONE, "ls": 1.4, "sa": 0},
    ], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP)
    footer(slide, 19, 19)


# ── 主流程 ──
def build():
    os.makedirs(ASSETS, exist_ok=True)
    data = json.load(open(DATA, encoding="utf-8"))
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    projects = data["projects"]
    nproj = len(projects)
    total = 1 + nproj + 1

    # 预取图片 -> jpg
    for p in projects:
        slug = p["slug"]
        entries = manifest.get(slug, [])
        n_want = p.get("nImages", 1)
        jpgs = []
        for e in entries[:n_want]:
            fp = os.path.join(ROOT, "public", "photos", slug, e["f"])
            if os.path.exists(fp):
                jpgs.append(prep_image(fp, 1600))
        p["_jpgs"] = jpgs

    prs = Presentation()
    prs.slide_width = Inches(PW)
    prs.slide_height = Inches(PH)

    # 封面 hero：沿用 p03 首图
    cover_jpg = projects[2]["_jpgs"][0] if projects[2]["_jpgs"] else None
    s = blank_slide(prs)
    bg(s)
    if cover_jpg:
        draw_cover(s, cover_jpg, data)
    else:
        single_text(s, 0.7, 3.0, 9, 1, "WZB STUDIO", DISPLAY, DISPLAY, 80, BONE, True)

    for i, p in enumerate(projects):
        s = blank_slide(prs)
        bg(s)
        side = "right" if i % 2 == 0 else "left"
        tpl_spread(s, p, p["_jpgs"], 2 + i, total, side)

    s = blank_slide(prs)
    draw_contact(s, data)

    prs.save(OUT)
    print(f"WROTE {OUT}")
    print(f"slides={len(prs.slides.__iter__.__self__._sldIdLst)}  total={total}  assets={len(os.listdir(ASSETS))}")


if __name__ == "__main__":
    build()
