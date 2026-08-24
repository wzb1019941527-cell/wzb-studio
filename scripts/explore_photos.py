import os, glob, json
from PIL import Image

DESK = r"C:/Users/wzb/Desktop/个人网站所需资料/过往项目照片"
exts = ('.webp', '.jpg', '.jpeg', '.png')

def num_of(name):
    # 取目录名开头的数字
    s = os.path.basename(name)
    digits = ''.join(ch for ch in s if ch.isdigit())
    return int(digits) if digits else 9999

dirs = sorted([os.path.join(DESK, d) for d in os.listdir(DESK) if os.path.isdir(os.path.join(DESK, d))], key=num_of)
print("总目录数:", len(dirs))
for d in dirs:
    n = num_of(d)
    files = sorted([f for f in os.listdir(d) if f.lower().endswith(exts)])
    sample = []
    for f in files[:3]:
        try:
            with Image.open(os.path.join(d, f)) as im:
                sample.append((f, im.size[0], im.size[1]))
        except Exception as e:
            sample.append((f, 'ERR', str(e)))
    print(f"\n[{n}] {os.path.basename(d)}")
    print(f"  图片数: {len(files)}, 命名示例: {[s[0] for s in sample]}")
    print(f"  前3张尺寸: {[(s[1],s[2]) for s in sample]}")
