"""Composite the AF4AI palace film: 3D build frames + aligned AI renders + Arabic titles -> H.264."""
import sys, os, math, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FMT = sys.argv[1]                      # 16x9 | 9x16 | 4x5
PREVIEW = len(sys.argv) > 2 and sys.argv[2] == 'preview'
FPS = 24
DUR = 35.0
W, H = {'16x9': (1920, 1080), '9x16': (1080, 1920), '4x5': (1080, 1350)}[FMT]
SRC = '16x9' if FMT == '16x9' else '9x16'          # 4:5 is a crop of the vertical film
CROP_Y = 110                                       # 4:5 crop offset inside the 1080x1920 frame

FD = 'node_modules/@fontsource/'
F_TITLE_AR = FD + 'reem-kufi/files/reem-kufi-arabic-700-normal.woff'
F_BODY_AR = FD + 'ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-500-normal.woff'
F_LOGO = FD + 'reem-kufi/files/reem-kufi-latin-700-normal.woff'
F_LATIN = FD + 'ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-500-normal.woff'
INK = (21, 32, 43); GOLD = (214, 166, 74); WHITE = (255, 255, 255); BG = (232, 236, 239)

S = min(W, H) / 1080                               # type scale
def font(path, px): return ImageFont.truetype(path, int(px * S))
fTitle, fSub, fTag = font(F_TITLE_AR, 64), font(F_BODY_AR, 30), font(F_LATIN, 22)
fLogoBig, fLogoSmall, fUrl = font(F_LOGO, 120), font(F_LOGO, 34), font(F_LATIN, 30)
fTagline = font(F_BODY_AR, 34)

def ease(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def seg(t, a, b): return min(1, max(0, (t - a) / (b - a)))

# ---------- sources ----------
cache = {}
def load(path):
    if path not in cache: cache[path] = Image.open(path).convert('RGB')
    return cache[path]

def frame3d(t):
    n0, n1 = round(1.5 * FPS), round(21.0 * FPS)
    n = min(n1, max(n0, round(t * FPS)))
    p = f'p05/frames/{SRC}/{n:05d}.jpg'
    while not os.path.exists(p) and n > n0: n -= 1; p = f'p05/frames/{SRC}/{n:05d}.jpg'
    im = Image.open(p).convert('RGB')
    return fit_src(im)

def fit_src(im):
    """Map a 16x9 or 9x16 source frame onto the output canvas (4:5 = crop of 9x16)."""
    if FMT == '4x5':
        im = im.resize((1080, 1920)) if im.size != (1080, 1920) else im
        return im.crop((0, CROP_Y, 1080, CROP_Y + 1350))
    return im.resize((W, H), Image.LANCZOS) if im.size != (W, H) else im

def render_img(name):
    return load(f'p05/renders/{name}-aligned.png')

def kenburns(im, scale, cx=.5, cy=.5):
    """Zoom into an image around (cx,cy) keeping the output size."""
    w, h = im.size; sw, sh = w / scale, h / scale
    x0 = min(max(cx * w - sw / 2, 0), w - sw); y0 = min(max(cy * h - sh / 2, 0), h - sh)
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + sw, y0 + sh)) if FMT != '4x5' else \
        fit_src(im.resize((1080, 1920), Image.LANCZOS, box=(x0, y0, x0 + sw, y0 + sh)))

# ---------- graphics ----------
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.22 * np.clip(r - 0.55, 0, 1) ** 1.6)[..., None].astype(np.float32)
SCRIM = np.clip((yy / H - 0.52) / 0.48, 0, 1)[..., None].astype(np.float32) ** 1.4
rng = np.random.default_rng(3)

def light_sweep(arr, k):
    """Golden diagonal light band crossing the frame, k in 0..1."""
    if k <= 0 or k >= 1: return arr
    pos = (xx / W * 0.75 + yy / H * 0.25) - (-0.35 + 1.7 * k)
    band = np.exp(-(pos / 0.11) ** 2)[..., None] * math.sin(math.pi * k)
    return arr + band * np.array([255, 214, 150], np.float32) * 0.38

def draw_text_block(img, t, t_in, t_out, title, sub=None, tag=None, on_photo=False):
    a = ease(seg(t, t_in, t_in + .55)) * (1 - ease(seg(t, t_out - .45, t_out)))
    if a <= 0: return
    rise = (1 - ease(seg(t, t_in, t_in + .7))) * 26 * S
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    col = WHITE if on_photo else INK
    if FMT == '16x9':
        xr, yb = W - 110 * S, H - 120 * S; anchor_x = 'r'
    else:
        xr, yb = W / 2, H - (260 if FMT == '9x16' else 170) * S; anchor_x = 'm'
    y = yb + rise
    if sub:
        d.text((xr, y), sub, font=fSub, fill=col + (int(235 * a),), anchor=anchor_x + 's', direction='rtl', language='ar')
        y -= 58 * S
    d.text((xr, y), title, font=fTitle, fill=col + (int(255 * a),), anchor=anchor_x + 's', direction='rtl', language='ar')
    tb = d.textbbox((xr, y), title, font=fTitle, anchor=anchor_x + 's', direction='rtl', language='ar')
    ly = tb[1] - 26 * S; grow = ease(seg(t, t_in + .15, t_in + .9))
    lw = 90 * S * grow
    if anchor_x == 'r': d.rectangle((xr - lw, ly, xr, ly + 3 * S), fill=GOLD + (int(255 * a),))
    else: d.rectangle((xr - lw / 2, ly, xr + lw / 2, ly + 3 * S), fill=GOLD + (int(255 * a),))
    if tag:
        tx = xr - lw - 16 * S if anchor_x == 'r' else xr
        d.text((tx if anchor_x == 'r' else xr, ly - 10 * S), tag, font=fTag, fill=GOLD + (int(255 * a),), anchor=('r' if anchor_x == 'r' else 'm') + 's')
    if on_photo:
        sh = layer.split()[3].filter(ImageFilter.GaussianBlur(10 * S)).point(lambda v: v * .55)
        img.paste(Image.new('RGB', (W, H), (0, 0, 0)), (0, 0), sh)
    img.alpha_composite(layer) if img.mode == 'RGBA' else img.paste(layer, (0, 0), layer)

def logo(d, cx, cy, f, alpha=255, dark_bg=True):
    parts = [('AF', WHITE if dark_bg else INK), ('4', GOLD), ('AI', WHITE if dark_bg else INK)]
    widths = [d.textlength(p, font=f) for p, _ in parts]; x = cx - sum(widths) / 2
    for (p, c), w in zip(parts, widths):
        d.text((x, cy), p, font=f, fill=c + (alpha,), anchor='lm'); x += w

def card(t, kind):
    img = Image.new('RGBA', (W, H), INK + (255,)); d = ImageDraw.Draw(img)
    if kind == 'intro':
        a = ease(seg(t, .15, .9)); sc = 0.94 + 0.06 * ease(seg(t, 0, 1.4))
        f = font(F_LOGO, 120 * sc)
        logo(d, W / 2, H / 2 - 30 * S, f, int(255 * a))
        b = ease(seg(t, .55, 1.2))
        d.text((W / 2, H / 2 + 70 * S), 'من النموذج إلى الواقع', font=fTagline, fill=(220, 226, 232, int(255 * b)), anchor='mm', direction='rtl', language='ar')
    else:
        a = ease(seg(t, 29.9, 30.6)); b = ease(seg(t, 30.3, 31.0))
        logo(d, W / 2, H / 2 - 60 * S, fLogoBig, int(255 * a))
        d.text((W / 2, H / 2 + 40 * S), 'صمّم مشروعك، وشاهده قبل أن يُبنى', font=fTagline, fill=(220, 226, 232, int(255 * b)), anchor='mm', direction='rtl', language='ar')
        d.rectangle((W / 2 - 40 * S, H / 2 + 95 * S, W / 2 + 40 * S, H / 2 + 98 * S), fill=GOLD + (int(255 * b),))
        d.text((W / 2, H / 2 + 140 * S), 'af4ai.com', font=fUrl, fill=GOLD + (int(255 * b),), anchor='mm')
    return img.convert('RGB')

# ---------- shot list ----------
FINAL = '01-front' if FMT == '16x9' else '04-front-vertical'
def base_frame(t):
    if t < 1.2: return card(t, 'intro'), False
    if t < 2.0:                                        # intro card dissolves into the empty site
        k = ease(seg(t, 1.2, 2.0)); return Image.blend(card(t, 'intro'), frame3d(t), k), False
    if t < 21.0: return frame3d(t), False
    if t < 22.2:                                       # 3D -> photoreal, same camera
        k = ease(seg(t, 21.0, 22.2)); ren = kenburns(render_img(FINAL), 1.0)
        return Image.blend(frame3d(21.0), ren, k), 'sweep'
    if FMT == '16x9':
        if t < 25.6: return kenburns(render_img(FINAL), 1 + .05 * ease(seg(t, 22.2, 26.4))), True
        if t < 26.4:
            k = ease(seg(t, 25.6, 26.4))
            return Image.blend(kenburns(render_img(FINAL), 1 + .05 * ease(seg(t, 22.2, 26.4))),
                               kenburns(render_img('03-aerial'), 1.08 - .07 * ease(seg(t, 25.6, 30.0)), .5, .45), k), True
        A = kenburns(render_img('03-aerial'), 1.08 - .07 * ease(seg(t, 25.6, 30.0)), .5, .45)
    else:
        if t < 25.6: return kenburns(render_img(FINAL), 1 + .05 * ease(seg(t, 22.2, 26.4))), True
        detail = lambda: kenburns(render_img(FINAL), 1.55 + .1 * ease(seg(t, 25.6, 30.0)), .5, .30 + .07 * ease(seg(t, 25.6, 30.0)))
        if t < 26.4:
            k = ease(seg(t, 25.6, 26.4))
            return Image.blend(kenburns(render_img(FINAL), 1 + .05 * ease(seg(t, 22.2, 26.4))), detail(), k), True
        A = detail()
    if t < 29.2: return A, True
    if t < 30.0: return Image.blend(A, card(t, 'end'), ease(seg(t, 29.2, 30.0))), True
    return card(t, 'end'), None

def compose(n):
    t = n / FPS
    img, photo = base_frame(t)
    arr = np.asarray(img).astype(np.float32)
    if photo == 'sweep': arr = light_sweep(arr, seg(t, 21.0, 22.4))
    if photo is True: arr = arr * (1 - .45 * SCRIM)        # legible white titles on the photos
    arr = arr * VIGNETTE + rng.normal(0, 3.2, (H, W, 1)).astype(np.float32)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
    # titles
    draw_text_block(img, t, 2.1, 6.4, 'الرفع المساحي', 'نبدأ من الأرض كما هي', '01')
    draw_text_block(img, t, 6.6, 10.9, 'الهيكل الإنشائي', 'أعمدة وبلاطات ترتفع دورًا بعد دور', '02')
    draw_text_block(img, t, 11.1, 15.0, 'الواجهات والزخارف', 'شبابيك وبلسترات وكرانيش', '03')
    draw_text_block(img, t, 15.3, 19.7, 'التشطيب والقباب', 'الخامات النهائية تكتمل', '04')
    draw_text_block(img, t, 21.5, 25.7, 'من النموذج إلى الواقع', 'نفس التصميم بالخامات والضوء الحقيقي', on_photo=True)
    draw_text_block(img, t, 26.2, 29.2, 'كل تفصيلة محسوبة', on_photo=True)
    # corner logo during the film body
    ca = ease(seg(t, 2.0, 2.6)) * (1 - ease(seg(t, 29.0, 29.6)))
    if ca > 0:
        d = ImageDraw.Draw(img); f = fLogoSmall
        cx = W - 70 * S - d.textlength('AF4AI', font=f) / 2; cy = 70 * S
        logo(d, cx, cy, f, int(230 * ca), dark_bg=photo is True)
    return img.convert('RGB')

if __name__ == '__main__':
    if PREVIEW:
        for t in [float(x) for x in sys.argv[3].split(',')]:
            compose(round(t * FPS)).save(f'preview_{FMT}_{t:.1f}.jpg', quality=88)
        sys.exit()
    out = f'video/af4ai-palace-{FMT}.mp4'; os.makedirs('video', exist_ok=True)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    total = int(DUR * FPS)
    for n in range(total):
        ff.stdin.write(compose(n).tobytes())
        if n % 48 == 0: print(f'{FMT} {n}/{total}', flush=True)
    ff.stdin.close(); ff.wait(); print('done', out)
