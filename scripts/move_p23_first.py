"""把 p23「漂移」条目移动到 CASES 数组第一个位置"""
from pathlib import Path

p = Path(r"E:\woekbuddy  ai\2026-07-19-18-50-25\src\components\Cases.tsx")
text = p.read_text(encoding="utf-8")

# p23 完整块（含尾随换行）
p23_start = "  {\n    slug: 'p23'"
i = text.index(p23_start)
# 块结束于其后第一个 "  },\n"
j = text.index("  },\n", i) + len("  },\n")
p23_block = text[i:j]

# 从原位置移除
text = text[:i] + text[j:]

# 插入到数组声明之后（p01 之前）
arr = "const CASES: CaseStudy[] = [\n"
k = text.index(arr) + len(arr)
text = text[:k] + p23_block + text[k:]

p.write_text(text, encoding="utf-8")
print("p23 moved to first position")
