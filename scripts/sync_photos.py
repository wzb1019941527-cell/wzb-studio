import os, re, json, shutil, hashlib
from PIL import Image

ROOT = r"E:/woekbuddy  ai/2026-07-19-18-50-25"
DESK = r"C:/Users/wzb/Desktop/个人网站所需资料/过往项目照片"
PUB = os.path.join(ROOT, "public", "photos")
MANIFEST_PATH = os.path.join(ROOT, "src", "data", "projectsManifest.json")
EXTS = (".webp", ".jpg", ".jpeg", ".png")
TARGET_LONG = 2400
QUALITY = 92

def dir_num(name):
    digits = re.findall(r"\d+", os.path.basename(name))
    return int(digits[0]) if digits else 9999

def file_sort_key(fn):
    digits = re.findall(r"\d+", fn)
    return (int(digits[0]) if digits else 0, fn.lower())

def src_stamp(path):
    # 源文件前 4KB 的 md5 前 6 位 → 当版本戳；桌面文件没变就稳定，变了文件名跟着变
    try:
        with open(path, "rb") as f:
            return hashlib.md5(f.read(4096)).hexdigest()[:6]
    except Exception:
        return "000000"

def clear_dir(d):
    if not os.path.isdir(d):
        os.makedirs(d, exist_ok=True)
        return
    for entry in os.listdir(d):
        p = os.path.join(d, entry)
        if os.path.isfile(p):
            os.remove(p)
        else:
            shutil.rmtree(p)

manifest = {}
summary = []
for d in sorted(
    [os.path.join(DESK, x) for x in os.listdir(DESK) if os.path.isdir(os.path.join(DESK, x))],
    key=dir_num,
):
    n = dir_num(d)
    slug = f"p{n:02d}"
    files = sorted([f for f in os.listdir(d) if f.lower().endswith(EXTS)], key=file_sort_key)
    out_dir = os.path.join(PUB, slug)
    os.makedirs(out_dir, exist_ok=True)
    recs = []
    for i, f in enumerate(files, start=1):
        src = os.path.join(d, f)
        try:
            with Image.open(src) as im:
                im = im.convert("RGB")
                w, h = im.size
                scale = min(1.0, TARGET_LONG / max(w, h))
                if scale < 1.0:
                    im = im.resize((int(round(w * scale)), int(round(h * scale))), Image.LANCZOS)
                out_name = f"{i:02d}.{src_stamp(src)}.webp"
                im.save(os.path.join(out_dir, out_name), "WEBP", quality=QUALITY)
                recs.append({"f": out_name, "w": im.size[0], "h": im.size[1]})
        except Exception as e:
            print(f"  ! 跳过 {slug}/{f}: {e}")
    manifest[slug] = recs
    summary.append((slug, len(recs), os.path.basename(d)))

with open(MANIFEST_PATH, "w", encoding="utf-8") as fw:
    json.dump(manifest, fw, ensure_ascii=False, indent=2)

print("\n===== 同步完成 =====")
print(f"共 {len(manifest)} 个 slug")
for slug, cnt, name in summary:
    print(f"  {slug}: {cnt} 张  <- {name}")
