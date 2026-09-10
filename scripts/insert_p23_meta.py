"""把 p23 元数据插入 Cases.tsx 的 CASES 数组（p02 之后）"""
from pathlib import Path

p = Path(r"E:\woekbuddy  ai\2026-07-19-18-50-25\src\components\Cases.tsx")
text = p.read_text(encoding="utf-8")

anchor = "    themeColor: '#2A2522',\n  },\n  {\n    slug: 'p03'"
assert anchor in text, "anchor not found"

block = (
    "    themeColor: '#2A2522',\n"
    "  },\n"
    "  {\n"
    "    slug: 'p23', title: '「漂移」林枞个展', en: 'DRIFT',\n"
    "    city: '深圳', year: '2026', category: 'Exhibition & Gallery Curation', location: 'Shenzhen, China',\n"
    "    storyEn: 'Lin Cong’s solo exhibition “Drift” — forms drifting quietly through the gallery, "
    "where restrained spatial styling frees each work from a fixed anchor and lets it find its own mooring in the viewer’s passage.',\n"
    "    storyCn: '林枞个展「漂移」：形态在展厅中缓缓漂移，克制的空间展陈让每件作品脱离固定锚点，在观者的行走之间找到各自的落点。',\n"
    "    themeColor: '#272320',\n"
    "  },\n"
    "  {\n"
    "    slug: 'p03'"
)

text = text.replace(anchor, block, 1)
p.write_text(text, encoding="utf-8")
print("p23 metadata inserted OK")
