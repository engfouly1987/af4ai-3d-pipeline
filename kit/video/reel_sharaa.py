"""Sharaa Resort 23 s silent 9:16 reel: 3D design build -> Veo construction time-lapse (same framing) -> final images -> end card."""
import sys, os, subprocess, numpy as np
sys.argv = [sys.argv[0], '9x16'] + sys.argv[1:]
import compose_s as C
from PIL import Image, ImageDraw, ImageFilter

FPS, DUR, W, H = 24, 23.0, C.W, C.H
ease, seg = C.ease, C.seg
# Folder with the clean anchor images of the project album (set ALBUM_ANCHORS to override).
A = os.path.join(os.environ.get('ALBUM_ANCHORS', 'album/00_Anchors'), '')
IMG = {'aerial': A + 'EXT-01_Clean_Anchor.jpg', 'club': A + 'EXT-04_Clean_End_Frame.jpg', 'bazaar': A + 'EXT-06_Clean_Start_Frame.jpg', 'recep': A + 'INT-01_Clean_Anchor.jpg'}
T3D0, T3D1 = 0.7, 6.9            # 3D frames 0..148 play here
TV0 = 7.5                        # Veo time-lapse starts (192 frames = 8 s)
TV1 = TV0 + 8.0
cache = {}

def vcrop(im, scale=1.0, cx=.5, cy=.5):
    """9:16 window out of a 16:9 source, zoomed by scale, centred at (cx, cy)."""
    w, h = im.size; ch = h / scale; cw = ch * 9 / 16
    x0 = min(max(cx * w - cw / 2, 0), w - cw); y0 = min(max(cy * h - ch / 2, 0), h - ch)
    out = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    return out.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))

def img(k):
    if k not in cache: cache[k] = Image.open(IMG[k]).convert('RGB')
    return cache[k]

def f3d(t):
    n = int(min(148, max(0, round((t - T3D0) / (T3D1 - T3D0) * 148))))
    return Image.open(f'p09/frames/{n:04d}.jpg').convert('RGB')

def veo(t):
    n = int(min(192, max(1, round((t - TV0) * FPS) + 1)))
    k = f'v{n}'
    if k not in cache:
        if len(cache) > 40: [cache.pop(x) for x in [x for x in cache if x.startswith('v')][:20]]
        cache[k] = vcrop(Image.open(f'p09/veo/{n:04d}.png').convert('RGB'), 1.0, .5, .5)
    return cache[k]

def punch(t, at, amt=.05, dur=.5):
    if t < at or t > at + dur: return 0
    return amt * (1 - (t - at) / dur) ** 2

def base(t):
    if t < .7: return C.card(t + .5, 'intro'), False
    if t < 1.2: return Image.blend(C.card(t + .5, 'intro'), f3d(t), ease(seg(t, .7, 1.2))), False
    if t < T3D1: return f3d(t), False
    if t < TV0: return Image.blend(f3d(T3D1), veo(TV0), ease(seg(t, T3D1, TV0))), 'blend'
    if t < TV1 - .6: return veo(t), 'veo'
    if t < TV1 + .3:                                                       # time-lapse end -> final aerial with light sweep
        k = ease(seg(t, TV1 - .6, TV1 + .3)); return Image.blend(veo(min(t, TV1 - .01)), vcrop(img('aerial'), 1.0 + .04 * k, .5, .52), k), 'sweep'
    if t < 17.4: return vcrop(img('aerial'), 1.04 + .10 * ease(seg(t, TV1 + .3, 17.4)) + punch(t, TV1 + .3, .03), .5, .52), True
    if t < 18.7: return vcrop(img('club'), 1.08 + .08 * ease(seg(t, 17.4, 18.7)) + punch(t, 17.4), .62, .55), True
    if t < 20.0: return vcrop(img('bazaar'), 1.0 + .10 * ease(seg(t, 18.7, 20.0)) + punch(t, 18.7), .5, .55), True
    if t < 21.0: return vcrop(img('recep'), 1.0 + .08 * ease(seg(t, 20.0, 21.0)) + punch(t, 20.0), .58, .5), True
    if t < 21.6: return Image.blend(vcrop(img('recep'), 1.08, .58, .5), C.card(30.0 + (t - 21.6) + .6, 'end'), ease(seg(t, 21.0, 21.6))), True
    return C.card(30.0 + (t - 21.6) + .6, 'end'), None

def frame(n):
    t = n / FPS
    im, kind = base(t)
    arr = np.asarray(im).astype(np.float32)
    if kind == 'sweep': arr = C.light_sweep(arr, seg(t, TV1 - .6, TV1 + .6))
    if kind in (True, 'veo'): arr = arr * (1 - .4 * C.SCRIM)
    arr = arr * C.VIGNETTE + C.rng.normal(0, 2.2, (H, W, 1)).astype(np.float32)
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
    tb = C.draw_text_block
    tb(im, t, 1.3, 3.6, 'التصميم', 'نموذج ثلاثي الأبعاد للمنتجع', '01')
    tb(im, t, 3.8, 6.6, 'الفندق والفيلات', 'واحة خضراء على البحر', '02')
    tb(im, t, 7.9, 10.6, 'الموقع', 'أرض على الساحل الشمالي', '03', on_photo=True)
    tb(im, t, 11.0, 14.8, 'التنفيذ', 'من الأساسات إلى التسليم', '04', on_photo=True)
    tb(im, t, 15.9, 17.3, 'منتجع الشراع', 'الساحل الشمالي', on_photo=True)
    tb(im, t, 17.5, 18.6, 'النادي الشاطئي', on_photo=True)
    tb(im, t, 18.8, 19.9, 'البازار وقت الغروب', on_photo=True)
    tb(im, t, 20.1, 20.9, 'استقبال مفتوح على البحر', on_photo=True)
    ca = ease(seg(t, 1.0, 1.5)) * (1 - ease(seg(t, 20.8, 21.3)))
    if ca > 0:
        d = ImageDraw.Draw(im); f = C.fLogoSmall
        C.logo(d, W - 70 * C.S - d.textlength('AF4AI', font=f) / 2, 70 * C.S, f, int(230 * ca), dark_bg=kind in (True, 'veo', 'sweep', 'blend'))
    return im.convert('RGB')

if __name__ == '__main__':
    if 'preview' in sys.argv:
        for t in [2.0, 5.0, 7.2, 9.0, 13.0, 15.3, 16.5, 18.0, 19.4, 22.0]: frame(round(t * FPS)).save(f'p09/reel_{t}.jpg', quality=85)
        sys.exit()
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', 'p09/reel-master.mp4'], stdin=subprocess.PIPE)
    for n in range(int(DUR * FPS)): ff.stdin.write(frame(n).tobytes())
    ff.stdin.close(); ff.wait(); print('done')
