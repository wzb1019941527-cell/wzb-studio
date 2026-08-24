import imageio_ffmpeg, numpy as np

VIDEO = 'C:/Users/wzb/Downloads/QQ2026722-225217.mp4'

# 在 ffmpeg 解码阶段就降采样到 480 宽，速度极快（C 层完成）
gen = imageio_ffmpeg.read_frames(VIDEO, pix_fmt='rgb24',
                                 output_params=['-vf', 'scale=480:-1'])
# read_frames 先 yield 一个 meta dict
meta = next(gen)
fps = float(meta.get('fps', 30.0))
ow, oh = meta['size']  # (480, 220)
print('fps', round(fps,2), 'size', meta.get('size'), 'duration', round(float(meta.get('duration',0)),2))

prev = None
prev_cen = None
diffs = []
center_diff = []
brightness = []
W = ow; H = oh

for frame in gen:
    if isinstance(frame, dict):
        continue  # 跳过可能的 meta
    f = np.frombuffer(frame, dtype=np.uint8).reshape(H, W, 3).astype(np.float32)
    W = f.shape[1]; H = f.shape[0]
    g = f[:,:,0]*0.299 + f[:,:,1]*0.587 + f[:,:,2]*0.114
    cy0, cy1 = int(H*0.30), int(H*0.70)
    cx0, cx1 = int(W*0.30), int(W*0.70)
    cen = g[cy0:cy1, cx0:cx1]
    if prev is not None:
        diffs.append(np.mean(np.abs(g - prev)))
        center_diff.append(np.mean(np.abs(cen - prev_cen)))
    brightness.append(np.mean(cen))
    prev = g; prev_cen = cen

diffs = np.array(diffs); center_diff = np.array(center_diff); brightness = np.array(brightness)
N = len(diffs)
dn = diffs/(diffs.max()+1e-9)
cn = center_diff/(center_diff.max()+1e-9)

print('\n=== 总体 ===')
print('帧数:', N, ' 时长(s):', round(N/fps,1))
print('帧间差异 均值/峰值:', round(dn.mean(),3), round(dn.max(),3))
print('中央差异 均值/峰值:', round(cn.mean(),3), round(cn.max(),3))

thr = dn.mean()*2.2
peaks = np.where(dn > thr)[0]
if len(peaks) > 0:
    groups=[]; start=peaks[0]; pp=peaks[0]
    for p in peaks[1:]:
        if p-pp > int(fps*0.4):
            groups.append((start,pp)); start=p
        pp=p
    groups.append((start,pp))
    print('\n=== 交互事件(点击/大切换) ===')
    for i,(a,b) in enumerate(groups):
        print(f'事件{i+1}: {a/fps:.1f}s~{b/fps:.1f}s 持续~{(b-a)/fps:.1f}s 峰值{dn[a:b+1].max():.2f}')
else:
    print('未检测到明显交互高峰')

base = cn.mean()
moving = cn > base*1.6
segs=[]; s=None
for i,m in enumerate(moving):
    if m and s is None: s=i
    elif not m and s is not None: segs.append((s,i)); s=None
if s is not None: segs.append((s,len(moving)-1))
print('\n=== 中央持续运动段(视差/光标移动) ===')
for a,b in segs:
    print(f'  {a/fps:.1f}s~{b/fps:.1f}s 时长{(b-a)/fps:.1f}s')

print('\n=== 中央亮度 ===')
print('min/mean/max:', round(brightness.min(),1), round(brightness.mean(),1), round(brightness.max(),1))
print('峰峰值:', round(brightness.max()-brightness.min(),1))
