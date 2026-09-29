"""Build the Git/GitHub page illustrations as Lottie JSON + static SVG from one scene description.

Run:  python git-github/anim/build_anim.py
Output: git-github/anim/<name>.json (Lottie, played with lottie-web) and <name>.svg (still frame / fallback).
The shapes re-draw the page's original PNG illustrations in flat vector form.
"""
import json
import math
import os

OUT = os.path.dirname(os.path.abspath(__file__))
FR = 30
W, H = 800, 450

C = {
    "bg": "#eef7f0", "dg": "#123f33", "dg2": "#1e5245", "mg": "#5f9f86", "lg": "#93c7ae", "pale": "#d8ece1",
    "blue": "#6aa8dc", "blued": "#3f7dbf", "or": "#f28a2e", "skin": "#f6c49d", "skind": "#dd9c72",
    "white": "#ffffff", "gray": "#a9b3c3", "grayd": "#8f9aab", "key": "#2d3a3a", "teal": "#2c7a64",
}


def col(h):
    h = C.get(h, h).lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    return [round(int(h[i:i + 2], 16) / 255, 4) for i in (0, 2, 4)] + [1]


class A:
    """Animated value: keys = (t, value[, mode]); mode 'e' ease, 'l' linear, 'h' hold (until next key)."""

    def __init__(self, *keys, mode="e"):
        self.keys = sorted(keys, key=lambda k: k[0])
        self.mode = mode

    def at(self, t):
        ks = self.keys
        if t <= ks[0][0]:
            return ks[0][1]
        for a, b in zip(ks, ks[1:]):
            if a[0] <= t < b[0]:
                mode = a[2] if len(a) > 2 else self.mode
                if mode == "h":
                    return a[1]
                f = (t - a[0]) / (b[0] - a[0])
                if isinstance(a[1], (list, tuple)):
                    return [x + (y - x) * f for x, y in zip(a[1], b[1])]
                return a[1] + (b[1] - a[1]) * f
        return ks[-1][1]


def sampled(fn, t0, t1, step=2):
    ts = list(range(t0, t1, step)) + [t1]
    return A(*[(t, fn(t), "l") for t in ts], mode="l")


def as_list(v, n):
    if isinstance(v, (list, tuple)):
        v = list(v)
        return v + [0] * (n - len(v)) if len(v) < n else v
    return [v] * n if n > 1 else [v]


def prop(v, n=1, spatial=False, pad=None):
    """n = number of dims in the Lottie value; pad fills a 3rd dim (layer transforms)."""
    def conv(x):
        x = as_list(x, n) if n > 1 else (x if not isinstance(x, (list, tuple)) else x[0])
        if pad is not None and isinstance(x, list) and len(x) == 2:
            x = x + [pad]
        return x
    if not isinstance(v, A):
        return {"a": 0, "k": conv(v)}
    out = []
    for i, key in enumerate(v.keys):
        t, val = key[0], conv(key[1])
        k = {"t": t, "s": val if isinstance(val, list) else [val]}
        if i < len(v.keys) - 1:
            mode = key[2] if len(key) > 2 else v.mode
            if mode == "h":
                k["h"] = 1
            else:
                ox, oy, ix, iy = (0.0, 0.0, 1.0, 1.0) if mode == "l" else (0.33, 0.0, 0.67, 1.0)
                if spatial:
                    k["o"], k["i"] = {"x": ox, "y": oy}, {"x": ix, "y": iy}
                    k["to"], k["ti"] = [0, 0, 0], [0, 0, 0]
                else:
                    m = len(k["s"])
                    k["o"], k["i"] = {"x": [ox] * m, "y": [oy] * m}, {"x": [ix] * m, "y": [iy] * m}
        out.append(k)
    return {"a": 1, "k": out}


def val_at(v, t):
    return v.at(t) if isinstance(v, A) else v


# ---------- shapes ----------
def rect(x, y, w, h, r=0):
    return {"kind": "rect", "x": x, "y": y, "w": w, "h": h, "r": r}


def ell(cx, cy, w, h=None):
    return {"kind": "ell", "cx": cx, "cy": cy, "w": w, "h": w if h is None else h}


def path(pts, closed=False, smooth=False):
    """pts: list of (x, y). smooth=True makes a Catmull-Rom curve through the points."""
    n = len(pts)
    ins, outs = [[0, 0]] * n, [[0, 0]] * n
    if smooth and n > 2:
        ins, outs = [], []
        for i in range(n):
            p0 = pts[(i - 1) % n] if closed or i > 0 else pts[i]
            p2 = pts[(i + 1) % n] if closed or i < n - 1 else pts[i]
            tx, ty = (p2[0] - p0[0]) / 6, (p2[1] - p0[1]) / 6
            ins.append([-tx, -ty])
            outs.append([tx, ty])
    return {"kind": "path", "v": [list(p) for p in pts], "i": ins, "o": outs, "c": closed}


def arc_pts(cx, cy, r, a0, a1, n=12):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


def bez(p0, p1, p2, f):
    return [(1 - f) ** 2 * p0[i] + 2 * (1 - f) * f * p1[i] + f * f * p2[i] for i in (0, 1)]


def G(*geoms, fill=None, stroke=None, sw=4, fo=100, so=100, trim=None, p=(0, 0), a=(0, 0), s=100, o=100, r=0, cap=2):
    """A group: geometry + paint (+ optional trim end 0-100) + own transform."""
    return {"geoms": list(geoms), "fill": fill, "stroke": stroke, "sw": sw, "fo": fo, "so": so, "trim": trim,
            "p": p, "a": a, "s": s, "o": o, "r": r, "cap": cap}


def L(name, *groups, p=(0, 0), a=(0, 0), s=100, o=100, r=0, ip=0, op=None):
    return {"name": name, "groups": list(groups), "p": p, "a": a, "s": s, "o": o, "r": r, "ip": ip, "op": op}


# ---------- Lottie output ----------
def geom_json(g):
    if g["kind"] == "rect":
        return {"ty": "rc", "d": 1, "s": prop([g["w"], g["h"]], 2), "p": prop([g["x"] + g["w"] / 2, g["y"] + g["h"] / 2], 2), "r": prop(g["r"])}
    if g["kind"] == "ell":
        return {"ty": "el", "d": 1, "s": prop([g["w"], g["h"]], 2), "p": prop([g["cx"], g["cy"]], 2)}
    return {"ty": "sh", "d": 1, "ks": {"a": 0, "k": {"i": g["i"], "o": g["o"], "v": g["v"], "c": g["c"]}}}


def scale2(s):
    if isinstance(s, A):
        return A(*[(k[0], as_list(k[1], 2)) + tuple(k[2:]) for k in s.keys], mode=s.mode)
    return as_list(s, 2)


def group_json(g, i):
    it = [geom_json(x) for x in g["geoms"]]
    if g["trim"] is not None:
        it.append({"ty": "tm", "s": prop(0), "e": prop(g["trim"]), "o": prop(0), "m": 1})
    if g["stroke"]:
        it.append({"ty": "st", "c": prop(col(g["stroke"]), 4), "o": prop(g["so"]), "w": prop(g["sw"]), "lc": g["cap"], "lj": 2, "ml": 4})
    if g["fill"]:
        it.append({"ty": "fl", "c": prop(col(g["fill"]), 4), "o": prop(g["fo"]), "r": 1})
    it.append({"ty": "tr", "p": prop(g["p"], 2), "a": prop(g["a"], 2), "s": prop(scale2(g["s"]), 2), "r": prop(g["r"]),
               "o": prop(g["o"]), "sk": prop(0), "sa": prop(0)})
    return {"ty": "gr", "nm": "g%d" % i, "it": it}


def layer_json(l, ind, op):
    s = l["s"]
    s3 = A(*[(k[0], as_list(k[1], 2) + [100]) + tuple(k[2:]) for k in s.keys], mode=s.mode) if isinstance(s, A) else as_list(s, 2) + [100]
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": l["name"], "sr": 1, "ao": 0, "bm": 0, "st": 0,
            "ip": l["ip"], "op": l["op"] if l["op"] is not None else op,
            "ks": {"o": prop(l["o"]), "r": prop(l["r"]), "p": prop(l["p"], 2, spatial=True, pad=0),
                   "a": prop(l["a"], 2, pad=0), "s": prop(s3, 3)},
            # Lottie draws the first shape group on top, so emit groups top-first (the scene lists them bottom-first).
            "shapes": [group_json(g, i) for i, g in reversed(list(enumerate(l["groups"])))]}


# ---------- SVG output (still frame) ----------
def f(x):
    return ("%.2f" % x).rstrip("0").rstrip(".")


def tf(p, a, s, r):
    sx, sy = as_list(s, 2)
    parts = []
    if p[0] or p[1]:
        parts.append("translate(%s %s)" % (f(p[0]), f(p[1])))
    if r:
        parts.append("rotate(%s)" % f(r))
    if sx != 100 or sy != 100:
        parts.append("scale(%s %s)" % (f(sx / 100), f(sy / 100)))
    if a[0] or a[1]:
        parts.append("translate(%s %s)" % (f(-a[0]), f(-a[1])))
    return (' transform="%s"' % " ".join(parts)) if parts else ""


def geom_svg(g, paint):
    if g["kind"] == "rect":
        r = min(g["r"], g["w"] / 2, g["h"] / 2)
        return '<rect x="%s" y="%s" width="%s" height="%s"%s%s/>' % (f(g["x"]), f(g["y"]), f(g["w"]), f(g["h"]), (' rx="%s"' % f(r)) if r else "", paint)
    if g["kind"] == "ell":
        return '<ellipse cx="%s" cy="%s" rx="%s" ry="%s"%s/>' % (f(g["cx"]), f(g["cy"]), f(g["w"] / 2), f(g["h"] / 2), paint)
    v, i, o = g["v"], g["i"], g["o"]
    d = "M%s %s" % (f(v[0][0]), f(v[0][1]))
    segs = list(range(len(v) - 1)) + ([len(v) - 1] if g["c"] else [])
    for k in segs:
        n = (k + 1) % len(v)
        d += " C%s %s %s %s %s %s" % (f(v[k][0] + o[k][0]), f(v[k][1] + o[k][1]), f(v[n][0] + i[n][0]), f(v[n][1] + i[n][1]), f(v[n][0]), f(v[n][1]))
    if g["c"]:
        d += "Z"
    return '<path d="%s"%s/>' % (d, paint)


def svg_scene(layers, t, title):
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img"><title>%s</title>' % (W, H, title)]
    for l in layers:
        if t < l["ip"] or (l["op"] is not None and t >= l["op"]):
            continue
        lo = val_at(l["o"], t)
        if lo <= 0:
            continue
        out.append('<g%s%s>' % (tf(val_at(l["p"], t), val_at(l["a"], t), val_at(l["s"], t), val_at(l["r"], t)), (' opacity="%s"' % f(lo / 100)) if lo < 100 else ""))
        for g in l["groups"]:
            go = val_at(g["o"], t)
            if go <= 0:
                continue
            paint = ""
            paint += ' fill="%s"' % C.get(g["fill"], g["fill"]) if g["fill"] else ' fill="none"'
            if g["fill"] and val_at(g["fo"], t) < 100:
                paint += ' fill-opacity="%s"' % f(val_at(g["fo"], t) / 100)
            if g["stroke"]:
                paint += ' stroke="%s" stroke-width="%s" stroke-linecap="%s" stroke-linejoin="round"' % (C.get(g["stroke"], g["stroke"]), f(val_at(g["sw"], t)), "round" if g["cap"] == 2 else "butt")
                if g["trim"] is not None:
                    e = val_at(g["trim"], t)
                    if e <= 0:
                        continue
                    if e < 100:
                        paint += ' pathLength="100" stroke-dasharray="%s 100"' % f(e)
            out.append('<g%s%s>' % (tf(val_at(g["p"], t), val_at(g["a"], t), val_at(g["s"], t), val_at(g["r"], t)), (' opacity="%s"' % f(go / 100)) if go < 100 else ""))
            out.extend(geom_svg(x, paint) for x in g["geoms"])
            out.append("</g>")
        out.append("</g>")
    out.append("</svg>")
    return "\n".join(out)


def build(name, layers, op, still, title):
    doc = {"v": "5.7.4", "fr": FR, "ip": 0, "op": op, "w": W, "h": H, "nm": name, "ddd": 0, "assets": [],
           "layers": [layer_json(l, i + 1, op) for i, l in enumerate(reversed(layers))]}
    with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as fp:
        json.dump(doc, fp, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as fp:
        fp.write(svg_scene(layers, still, title))
    print(name, "layers", len(layers), "json", os.path.getsize(os.path.join(OUT, name + ".json")), "bytes")


def bg():
    return L("bg", G(rect(0, 0, W, H), fill="bg"))


def pulse(t0, dur=10, lo=0, hi=100):
    return A((0, lo, "h"), (t0, lo), (t0 + dur / 2, hi), (t0 + dur, lo))


# =====================================================================
# Shared helpers for the scenes
# =====================================================================
def norm(v):
    d = math.hypot(v[0], v[1]) or 1
    return (v[0] / d, v[1] / d)


def rot(v, deg):
    a = math.radians(deg)
    return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def arrow_head(tip, direction, size=16, spread=28):
    """Filled triangular arrow head at tip, pointing along direction (crisp at any angle)."""
    d = norm(direction)
    back = (tip[0] - d[0] * size, tip[1] - d[1] * size)
    side = rot(d, 90)
    w = size * math.tan(math.radians(spread))
    return path([tip, (back[0] + side[0] * w, back[1] + side[1] * w), (back[0] - side[0] * w, back[1] - side[1] * w)], closed=True)


def shaft_end(tip, direction, size):
    """Where the line should stop so its round cap stays hidden inside the arrow head."""
    d = norm(direction)
    return (tip[0] - d[0] * size * 0.7, tip[1] - d[1] * size * 0.7)


def cr_point(pts, f):
    """Point at f (0-1) along a Catmull-Rom curve through pts (same curve family as path(..., smooth=True))."""
    f = max(0.0, min(1.0, f))
    n = len(pts) - 1
    u = f * n
    i = min(int(u), n - 1)
    t = u - i
    p0, p1, p2 = pts[max(i - 1, 0)], pts[i], pts[i + 1]
    p3 = pts[min(i + 2, n)]
    return [0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3) for k in (0, 1)]


def curve_tangent(pts, f, eps=0.01):
    a, b = cr_point(pts, max(0, f - eps)), cr_point(pts, min(1, f + eps))
    return (b[0] - a[0], b[1] - a[1])


def curved_arrow(name, pts, color, sw, head, t0, t1, fade=None, both=False):
    """Line along pts drawn from t0 to t1 (trim), with crisp filled heads that pop in at the end."""
    end_dir = curve_tangent(pts, 0.999)
    body = list(pts)
    body[-1] = shaft_end(pts[-1], end_dir, head)
    if both:
        start_dir = curve_tangent(pts, 0.001)
        body[0] = shaft_end(pts[0], (-start_dir[0], -start_dir[1]), head)
    groups = [G(path(body, smooth=True), stroke=color, sw=sw, trim=A((0, 0, "h"), (t0, 0), (t1, 100)))]
    groups.append(G(arrow_head(pts[-1], end_dir, head), fill=color, o=A((0, 0, "h"), (t1 - 2, 0), (t1, 100))))
    if both:
        groups.append(G(arrow_head(pts[0], (-start_dir[0], -start_dir[1]), head), fill=color, o=A((0, 0, "h"), (t0, 0), (t0 + 2, 100))))
    return L(name, *groups, o=fade if fade is not None else 100)


def hill(x0, x1, ybase, amp, freq, phase, ybottom, n=24):
    pts = [(x0 + (x1 - x0) * k / n, ybase - amp * math.sin(freq * (k / n) * math.pi + phase)) for k in range(n + 1)]
    return path(pts + [(x1, ybottom), (x0, ybottom)], closed=True)


# =====================================================================
# 1. Terminal: two hands type on the laptop; each command appears line by line in the terminal.
#    Layout follows the original terminal-guide.png (1672x941 scaled to 800x450).
# =====================================================================
def hand(cx, cy, m, finger_taps):
    """Back of a hand resting on the keyboard. m=1: left hand (thumb on the right), m=-1: right hand."""
    X = lambda dx: cx + dx * m
    groups = []
    # thumb: on the inner side, lying towards the space bar
    tb = (X(33), cy + 22)
    groups.append(G(rect(tb[0] - 10, tb[1] - 44, 20, 50, 10), fill="skin", p=tb, a=tb, r=54 * m))
    fingers = [(-40, 17, -26, -12), (-19, 19, -38, -5), (2, 20, -43, 0), (24, 19, -37, 7)]  # dx, width, tip, tilt
    base = cy - 6
    crease = []
    for k, (dx, w, tip, tilt) in enumerate(fingers):
        x = X(dx)
        taps = finger_taps.get(k, [])
        keys = [(0, [100, 100], "h")]
        for t in taps:
            keys += [(t, [100, 100], "l"), (t + 2, [100, 82], "l"), (t + 4, [100, 100], "h")]
        keys.append((150, [100, 100]))
        sc = A(*keys, mode="l")
        groups.append(G(rect(x - w / 2, cy + tip, w, base - (cy + tip) + 12, w / 2), fill="skin", p=(x, base), a=(x, base), r=tilt * m, s=sc))
        crease.append(G(path([(x - w * 0.26, cy + tip + 13), (x + w * 0.26, cy + tip + 13)]), stroke="#e9a784", sw=2, p=(x, base), a=(x, base), r=tilt * m, s=sc))
    back = path([(X(-51), cy - 6), (X(-48), cy + 22), (X(-32), cy + 46), (X(10), cy + 52), (X(36), cy + 40), (X(47), cy + 16), (X(46), cy - 8), (X(0), cy - 13)], closed=True, smooth=True)
    groups.append(G(back, fill="skin"))
    groups += crease
    groups.append(G(path([(X(-24), cy + 10), (X(-10), cy + 6)]), path([(X(4), cy + 8), (X(18), cy + 4)]), stroke="#e9a784", sw=2))
    return groups


def scene_terminal():
    op = 150
    lines = [(12, 40, 171, 96, "mg"), (50, 78, 200, 151, "blue"), (88, 116, 229, 96, "lg")]
    L_ = [bg()]
    L_.append(L("shadow", G(ell(220, 347, 404, 26), fill="#d4e9dd")))
    # laptop screen with a landscape
    L_.append(L("screen",
                G(rect(98, 104, 244, 164, 15), fill="dg"),
                G(rect(110, 116, 220, 140, 5), fill="#dcefee"),
                G(ell(283, 150, 36), fill="white"),
                G(hill(110, 330, 200, 20, 1.3, 0.2, 256), fill="#a7d2bd"),
                G(ell(128, 224, 15, 38), ell(147, 216, 19, 50), fill="#4d8a70"),
                G(hill(110, 330, 226, 14, 1.8, 1.4, 256), fill="#6aa98e"),
                G(hill(110, 330, 240, 8, 1.1, 2.6, 256), fill="#5a9a80")))
    # keyboard base in perspective with key rows, space bar and track pad
    keys = []
    for row in range(4):
        y = 270 + row * 12
        left = 100 - (y - 262) * 0.55
        right = 340 + (y - 262) * 0.55
        n = 13 if row < 3 else 11
        gap = 3.5
        kw = (right - left - (n - 1) * gap) / n
        for k in range(n):
            if row == 3 and 3 <= k <= 7:
                continue
            keys.append(rect(left + k * (kw + gap), y, kw, 9, 2.5))
    sp_left = 100 - (306 - 262) * 0.55
    sp_kw = (340 + (306 - 262) * 0.55 - sp_left - 10 * 3.5) / 11
    keys.append(rect(sp_left + 3 * (sp_kw + 3.5), 306, 5 * sp_kw + 4 * 3.5, 9, 2.5))
    L_.append(L("keyboard",
                G(path([(92, 262), (348, 262), (394, 338), (46, 338)], closed=True), fill="#aab4c4"),
                G(rect(44, 336, 352, 11, 5.5), fill="#8e99ab"),
                G(*keys, fill="#2c3838"),
                G(rect(176, 319, 88, 15, 4), fill="#98a3b4")))
    # typing schedule: hands alternate, different fingers press
    seq = [(0, 2), (1, 1), (0, 1), (1, 2), (0, 3), (1, 3), (0, 0), (1, 0)]
    taps, k = [], 0
    for s, e, *_ in lines:
        t = s
        while t + 4 <= e:
            taps.append((t,) + seq[k % len(seq)])
            k += 1
            t += 4
    def bob(h):
        ks = [(0, [0, 0], "h")]
        for t, hh, _ in taps:
            if hh == h:
                ks += [(t, [0, 0], "l"), (t + 2, [0, 2.5], "l"), (t + 4, [0, 0], "h")]
        ks.append((150, [0, 0]))
        return A(*ks, mode="l")
    for h, (cx, m) in enumerate([(138, 1), (302, -1)]):
        ft = {}
        for t, hh, fg in taps:
            if hh == h:
                ft.setdefault(fg, []).append(t)
        L_.append(L("hand-%s" % ("left" if m == 1 else "right"), *hand(cx, 318, m, ft), p=bob(h)))
    # sleeves cover the wrists
    L_.append(L("sleeves", G(path([(92, 350), (180, 372), (132, 404), (8, 404)], closed=True), path([(348, 350), (260, 372), (308, 404), (432, 404)], closed=True), fill="#2a5e4f"),
                G(path([(96, 352), (178, 372)]), path([(344, 352), (262, 372)]), stroke="#3b7361", sw=5)))
    typing = A((0, 0, "h"), *[kk for s, e, *_ in lines for kk in ((s, 0), (s + 3, 100), (e - 3, 100), (e, 0))])
    L_.append(L("tap-lines", G(path([(44, 236), (56, 254)]), path([(30, 264), (50, 270)]), path([(32, 292), (52, 288)]), stroke="or", sw=5), o=typing))
    # arrow laptop -> terminal
    L_.append(curved_arrow("arrow", [(334, 282), (372, 236), (440, 218)], "or", 8, 20, 8, 24, fade=A((0, 100, "h"), (140, 100), (148, 0))))
    # terminal window
    L_.append(L("terminal", G(rect(455, 111, 275, 188, 16), fill="#113a31"),
                G(rect(455, 111, 275, 32, 16), rect(455, 127, 275, 16), fill="#1c4a3f"),
                G(ell(475, 127, 13), fill="or"), G(ell(497, 127, 13), fill="mg"), G(ell(519, 127, 13), fill="lg")))
    ys = [171, 200, 229, 263]
    for n, y in enumerate(ys):
        start = lines[n][0] if n < 3 else 118
        L_.append(L("prompt%d" % n, G(path([(482, y - 7), (489, y), (482, y + 7)]), stroke="white", sw=3.5),
                    o=A((0, 0, "h"), (start, 100, "h"), (140, 100), (148, 0))))
    for n, (s, e, y, w, c) in enumerate(lines):
        L_.append(L("line%d" % n, G(rect(0, -7, w, 14, 7), fill=c), p=(505, y),
                    s=A((0, [0, 100], "h"), (s, [0, 100], "l"), (e, [100, 100], "h"), (150, [100, 100])),
                    o=A((0, 100, "h"), (140, 100), (148, 0))))
    cur = [(0, [507, 171], "h")]
    for n, (s, e, y, w, c) in enumerate(lines):
        cur += [(s, [507, y], "l"), (e, [505 + w + 8, y], "h")]
    cur += [(118, [507, 263], "h"), (150, [507, 263])]
    blink = [(0, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(124, 150, 7))] + [(150, 100)]
    L_.append(L("cursor", G(rect(-3.5, -12, 7, 24, 2), fill="or"), p=A(*cur, mode="l"), o=A(*blink, mode="h")))
    done = A((0, 35, "h"), *[kk for s, e, *_ in lines for kk in ((e - 1, 35), (e + 3, 100), (e + 10, 35))])
    L_.append(L("sparkle", G(path([(716, 70), (713, 95)]), path([(757, 84), (739, 102)]), path([(773, 116), (749, 121)]), stroke="mg", sw=6), o=done))
    build("terminal-guide", L_, op, 130, "ノートPCで入力したコマンドがターミナルに1行ずつ表示されるイメージ")


# =====================================================================
# 2. Local and remote: commit stays in the PC; push sends it to GitHub; pull brings changes back.
#    Layout follows local-remote-guide.png.
# =====================================================================
def doc_stack(front, colors_back, lines=("mg", "blue", "or")):
    x, y, w, h = front
    g = []
    for (bx, by, c) in colors_back:
        g.append(G(rect(bx, by, w, h, 8), fill=c))
    g += [G(rect(x, y, w, h, 8), fill="white"),
          G(path([(x + w - 18, y), (x + w, y + 18), (x + w - 18, y + 18)], closed=True), fill="#cfe5da"),
          *[G(rect(x + 12, y + 24 + k * 15, [0.52, 0.66, 0.46][k] * w, 7, 3.5), fill=c) for k, c in enumerate(lines)]]
    return g


def scene_local_remote():
    op = 150
    L_ = [bg()]
    L_.append(L("docs-left", *doc_stack((45, 239, 79, 96), [(24, 218, "mg"), (33, 229, "blue")])))
    L_.append(L("laptop", G(rect(110, 143, 196, 136, 12), fill="#0f4436"), G(rect(121, 154, 174, 112, 3), fill="white"),
                G(path([(96, 278), (320, 278), (336, 302), (80, 302)], closed=True), fill="#1f6b57"), G(rect(180, 281, 56, 7, 3), fill="#0f4436")))
    L_.append(L("folder", G(rect(165, 180, 34, 14, 4), fill="#2e7a64"), G(rect(165, 187, 90, 62, 8), fill="#3f8f78"), G(rect(165, 199, 90, 50, 8), fill="#5aa88f"),
                p=(210, 218), a=(210, 218), s=A((0, 100, "h"), (8, 100), (14, 107), (20, 100), (126, 100), (131, 107), (137, 100))))
    L_.append(L("commit-badge", G(ell(0, 0, 26), fill="or"), G(path([(-6, 0), (-1.5, 5), (7, -5)]), stroke="white", sw=3.5),
                p=(262, 186), s=A((0, 0, "h"), (8, 0), (15, 115), (20, 100), (58, 100), (64, 0), (150, 0)), o=A((0, 100, "h"), (58, 100), (64, 0))))
    # cloud with servers and lock
    L_.append(L("cloud", G(ell(548, 240, 128, 100), ell(640, 190, 172, 172), ell(706, 240, 112, 100), rect(500, 228, 246, 60, 30), fill="#6fb0e0")))
    for k, (y, c, bar) in enumerate([(172, "mg", "mg"), (204, "blue", "mg"), (236, "or", "#c9b24a")]):
        L_.append(L("server%d" % k, G(rect(545, y, 90, 27, 5), fill="#0f4436"), G(rect(554, y + 11, 30, 5, 2.5), fill=bar),
                    G(ell(600, y + 13.5, 9), fill=c), G(ell(617, y + 13.5, 9), fill="white")))
    L_.append(L("server-blink", G(ell(617, 185.5, 13), ell(617, 217.5, 13), ell(617, 249.5, 13), fill="or"),
                o=A((0, 0, "h"), (56, 0), (60, 100), (66, 0), (70, 100), (78, 0))))
    L_.append(L("lock", G(path(arc_pts(672, 152, 10, 180, 360, 10)), stroke="white", sw=5), G(rect(651, 150, 43, 40, 7), fill="#0f4436"),
                G(ell(672, 165, 8), rect(670, 166, 4, 11, 2), fill="white")))
    L_.append(L("docs-right", *doc_stack((669, 241, 77, 96), [(708, 220, "blue"), (698, 229, "mg")])))
    L_.append(L("pulled-line", G(rect(681, 310, 30, 7, 3.5), fill="teal"), o=A((0, 0, "h"), (92, 0), (98, 100), (150, 100))))
    # push row (upper, right) and pull row (lower, left) with crisp arrow heads
    colors = ["teal", "blue", "or", "teal", "blue"]
    for k in range(5):
        t = 22 + k * 4
        L_.append(L("push-dot%d" % k, G(ell(0, 0, 13), fill=colors[k]), p=(336 + 22 * k, 187),
                    o=A((0, 40, "h"), (t, 40), (t + 4, 100), (t + 24, 100), (t + 32, 40))))
    for k in range(4):
        t = 84 + k * 4
        L_.append(L("pull-dot%d" % k, G(ell(0, 0, 13), fill=["blue", "or", "teal", "blue"][k]), p=(460 - 24 * k, 235),
                    o=A((0, 40, "h"), (t, 40), (t + 4, 100), (t + 24, 100), (t + 32, 40))))
    L_.append(L("arrow-push", G(path([(440, 187), (462, 187)]), stroke="teal", sw=9), G(arrow_head((480, 187), (1, 0), 20), fill="teal"),
                p=(460, 187), a=(460, 187), s=A((0, 100, "h"), (22, 100), (27, 118), (33, 100))))
    L_.append(L("arrow-pull", G(path([(368, 235), (348, 235)]), stroke="teal", sw=9), G(arrow_head((330, 235), (-1, 0), 20), fill="teal"),
                p=(350, 235), a=(350, 235), s=A((0, 100, "h"), (84, 100), (89, 118), (95, 100))))
    push_route = [(228, 200), (300, 130), (420, 112), (540, 150), (590, 186)]
    pull_route = [(690, 290), (560, 330), (400, 320), (280, 270), (220, 230)]
    mini = [G(rect(-17, -21, 34, 42, 5), fill="white", stroke="#cfe5da", sw=1.5), G(rect(-10, -10, 20, 4.5, 2), rect(-10, -1, 15, 4.5, 2), fill="mg"), G(rect(-10, 8, 17, 4.5, 2), fill="or")]
    L_.append(L("push-doc", *mini, p=sampled(lambda t: cr_point(push_route, (t - 24) / 32), 0, 150, 2), s=A((0, 80, "h"), (24, 80), (40, 100), (56, 70)),
                o=A((0, 0, "h"), (24, 0), (28, 100), (52, 100), (58, 0))))
    mini2 = [G(rect(-17, -21, 34, 42, 5), fill="white", stroke="#cfe5da", sw=1.5), G(rect(-10, -10, 20, 4.5, 2), fill="teal"), G(rect(-10, -1, 15, 4.5, 2), rect(-10, 8, 17, 4.5, 2), fill="blue")]
    L_.append(L("pull-doc", *mini2, p=sampled(lambda t: cr_point(pull_route, (t - 86) / 34), 0, 150, 2), s=A((0, 70, "h"), (86, 70), (104, 100), (120, 80)),
                o=A((0, 0, "h"), (86, 0), (90, 100), (116, 100), (122, 0))))
    L_.append(L("folder-glow", G(rect(158, 172, 104, 84, 12), stroke="or", sw=4), o=A((0, 0, "h"), (120, 0), (124, 100), (138, 100), (146, 0))))
    build("local-remote-guide", L_, op, 40, "PC内のフォルダとGitHubのリポジトリの間を、pushとpullで変更が行き来するイメージ")


# =====================================================================
# 3. History and restore: commits pile up in the locked box; one older version comes back to the PC.
#    Layout follows history-restore-guide.png; the person is a round, friendly character.
# =====================================================================
def version_card(x, y, w, h, sun, mt, border="#b9dccb", bw=2.5):
    return [G(rect(x, y, w, h, 9), fill="white", stroke=border, sw=bw),
            G(path([(x + w - 0.17 * w, y), (x + w, y + 0.17 * w), (x + w - 0.17 * w, y + 0.17 * w)], closed=True), fill="#b9dccb"),
            G(rect(x + 0.1 * w, y + 0.1 * h, 0.8 * w, 0.5 * h, 4), fill="#e4eff8"),
            G(ell(x + 0.7 * w, y + 0.24 * h, 0.18 * w), fill=sun),
            G(path([(x + 0.13 * w, y + 0.6 * h), (x + 0.4 * w, y + 0.29 * h), (x + 0.67 * w, y + 0.6 * h)], closed=True), fill=mt),
            G(path([(x + 0.5 * w, y + 0.6 * h), (x + 0.69 * w, y + 0.41 * h), (x + 0.88 * w, y + 0.6 * h)], closed=True), fill=mt, fo=65),
            G(rect(x + 0.12 * w, y + 0.7 * h, 0.64 * w, 0.065 * h, 3), rect(x + 0.12 * w, y + 0.82 * h, 0.44 * w, 0.065 * h, 3), fill="#a9cdbd")]


def scene_history():
    op = 160
    L_ = [bg()]
    cards = [(33, 114, 94, 118, "#a9c8d6", "#8fb0d4"), (145, 96, 104, 128, "or", "#3d7f73"), (266, 86, 101, 124, "blue", "#3f78b8"), (387, 72, 103, 127, "or", "#1f5a4a")]
    pops = [6, 18, 30, 42]
    for k, (x, y, w, h, sun, mt) in enumerate(cards):
        t = pops[k]
        L_.append(L("version%d" % k, *version_card(x, y, w, h, sun, mt), p=(x + w / 2, y + h / 2), a=(x + w / 2, y + h / 2),
                    s=A((0, 60, "h"), (t, 60), (t + 8, 104), (t + 12, 100)), o=A((0, 0, "h"), (t, 0), (t + 5, 100))))
    for k in range(3):
        x0, y0, w0 = cards[k][0], cards[k][1], cards[k][2]
        x1, y1, w1 = cards[k + 1][0], cards[k + 1][1], cards[k + 1][2]
        s_pt, e_pt = (x0 + 0.44 * w0, y0 - 12), (x1 + 0.1 * w1, y1 - 7)
        mid = ((s_pt[0] + e_pt[0]) / 2, min(s_pt[1], e_pt[1]) - 22)
        t = pops[k + 1]
        L_.append(curved_arrow("step-arrow%d" % k, [s_pt, mid, e_pt], "teal", 5.5, 15, t - 6, t + 3))
    L_.append(curved_arrow("to-box", [(498, 100), (548, 92), (592, 124)], "teal", 6.5, 18, 48, 60))
    # locked box = repository keeping every commit
    L_.append(L("box",
                G(path([(744, 128), (764, 114), (764, 204), (744, 218)], closed=True), fill="#174f40"),
                G(rect(600, 126, 146, 92, 6), fill="#1f6b57"),
                G(path([(598, 120), (748, 120), (768, 106), (618, 106)], closed=True), fill="#3a9477"),
                G(rect(594, 116, 158, 15, 4), fill="#2f8a6f"),
                G(path(arc_pts(672, 160, 10, 180, 360, 10)), stroke="#eef5f0", sw=5), G(rect(656, 158, 32, 28, 6), fill="#eef5f0"),
                G(ell(672, 168, 7), rect(670.5, 169, 3, 8, 1.5), fill="dg"),
                p=(672, 218), a=(672, 218), s=A((0, 100, "h"), (58, 100), (62, 106), (68, 100))))
    L_.append(L("box-spark", G(path([(640, 76), (630, 62)]), path([(672, 68), (672, 48)]), path([(704, 76), (714, 62)]), stroke="or", sw=5),
                o=A((0, 0, "h"), (58, 0), (62, 100), (80, 100), (86, 0))))
    # desk scene: chair, person, laptop (seen from behind), plant, books
    L_.append(L("chair", G(rect(646, 316, 36, 84, 13), fill="#23574a")))
    hop = A((0, [0, 0], "h"), (128, [0, 0]), (133, [0, -7]), (138, [0, 0]), (142, [0, -3]), (146, [0, 0]), (160, [0, 0]))
    L_.append(L("person",
                G(path([(540, 402), (542, 352), (556, 324), (584, 310), (616, 312), (642, 328), (656, 356), (660, 402)], closed=True, smooth=True), fill="#4a86c0"),
                G(path([(598, 336), (605, 372)]), path([(628, 332), (638, 364)]), stroke="#3f77ae", sw=2.5),
                G(rect(573, 290, 20, 32, 7), fill="skin"),
                G(path([(571, 314), (583, 322), (597, 314)], smooth=True), stroke="#eaf3fb", sw=4.5),
                G(ell(590, 255, 88, 84), fill="dg"),
                G(ell(580, 267, 72, 68), fill="skin"),
                G(ell(616, 271, 13, 17), fill="skin"), G(path([(614, 266), (619, 272), (614, 276)], smooth=True), stroke="#e9a784", sw=2),
                G(path([(545, 266), (547, 242), (565, 225), (592, 218), (618, 226), (633, 248), (624, 258), (612, 244), (600, 254), (588, 240), (574, 254), (559, 255)], closed=True, smooth=True), fill="dg"),
                G(ell(556, 285, 13, 7.5), ell(597, 285, 13, 7.5), fill="#f59c95", fo=80),
                G(path([(568, 290), (574.5, 295.5), (581, 290)], smooth=True), stroke="#b8553c", sw=2.4),
                p=hop))
    blink = A((0, [100, 100], "h"), (44, [100, 100], "l"), (47, [100, 12], "l"), (50, [100, 100], "h"), (104, [100, 100], "l"), (107, [100, 12], "l"), (110, [100, 100], "h"), (160, [100, 100]))
    L_.append(L("eyes", G(ell(563, 272, 9.5, 13), ell(587, 272, 10.5, 14), fill="#2b2f33"), G(ell(565, 268.5, 3.6), ell(589.5, 268.5, 3.9), fill="white"),
                p=A((0, [575, 272], "h"), (128, [575, 272]), (133, [575, 265]), (138, [575, 272]), (142, [575, 269]), (146, [575, 272]), (160, [575, 272])), a=(575, 272), s=blink))
    L_.append(L("laptop", G(path([(426, 316), (520, 316), (544, 396), (450, 396)], closed=True), fill="#aebfd9", stroke="#c5d3e6", sw=2),
                G(rect(446, 394, 150, 8, 4), fill="#7f93b1")))
    L_.append(L("logo", G(ell(485, 356, 18), fill="white"), p=(485, 356), a=(485, 356), s=A((0, 100, "h"), (124, 100), (130, 135), (138, 100))))
    L_.append(L("arm", G(path([(572, 330), (556, 356), (552, 378), (548, 388)], smooth=True), stroke="#3f77ae", sw=20), G(path([(572, 330), (556, 356), (552, 376)], smooth=True), stroke="#4a86c0", sw=15),
                G(ell(546, 390, 24, 15), fill="skin"), G(path([(539, 387), (545, 390)]), stroke="#e9a784", sw=1.8), p=hop))
    L_.append(L("desk", G(rect(349, 400, 431, 14, 7), fill="#cfe5da")))
    L_.append(L("plant", G(ell(378, 356, 15, 30), fill="#2f7a63", p=(382, 370), a=(382, 370), r=-30), G(ell(389, 350, 17, 36), fill="#25694f", p=(389, 368), a=(389, 368), r=-3),
                G(ell(401, 356, 15, 30), fill="#2f7a63", p=(397, 370), a=(397, 370), r=28), G(ell(386, 364, 11, 22), fill="#3b8a70", p=(388, 372), a=(388, 372), r=-62),
                G(path([(368, 370), (410, 370), (405, 402), (373, 402)], closed=True), fill="white", stroke="#d6e6dd", sw=2)))
    L_.append(L("books", G(rect(748, 342, 26, 52, 5), fill="#23574a"), G(path([(754, 344), (751, 322)]), stroke="or", sw=4), G(path([(764, 344), (768, 320)]), stroke="blued", sw=4),
                G(rect(688, 378, 72, 16, 3), fill="#3f78b8"), G(rect(692, 383, 64, 3.5, 1.5), fill="white"),
                G(rect(694, 362, 62, 16, 3), fill="#2e7a64"), G(rect(698, 367, 54, 3.5, 1.5), fill="white")))
    # restore: pick version 2, the arrow runs to the PC, and a copy of that version arrives there
    L_.append(L("pick-frame", G(rect(141, 92, 112, 136, 12), stroke="dg", sw=5.5), o=A((0, 0, "h"), (74, 0), (80, 100), (142, 100), (150, 0))))
    route = [(197, 240), (216, 290), (296, 316), (424, 318)]
    L_.append(curved_arrow("restore-arrow", route, "blued", 7, 20, 82, 100, fade=A((0, 100, "h"), (142, 100), (150, 0)), both=True))
    fly = [(197, 160), (206, 262), (262, 314), (380, 322), (485, 356)]
    L_.append(L("restored-copy", *version_card(145, 96, 104, 128, "or", "#3d7f73"), p=sampled(lambda t: cr_point(fly, (t - 100) / 26), 0, 160, 2), a=(197, 160),
                s=A((0, 100, "h"), (100, 100), (126, 30), (160, 30)), o=A((0, 0, "h"), (100, 0), (104, 100), (124, 100), (130, 0))))
    build("history-restore-guide", L_, op, 118, "コミットした過去の版から1つを選び、作業フォルダへ取り出すイメージ")


# =====================================================================
# 4. Explorer: type cmd in the address bar and press Enter; Command Prompt opens in that folder.
#    Layout follows explorer-cmd-guide.png.
# =====================================================================
def folder_icon(x, y, inner=None):
    g = [G(rect(x, y, 38, 13, 4), fill="#f0b42e"), G(rect(x, y + 6, 93, 67, 7), fill="#f6c643"), G(rect(x, y + 15, 93, 58, 7), fill="#fbd968")]
    cx, cy = x + 46.5, y + 45
    b = "#c99a3a"
    if inner == "img":
        g += [G(rect(cx - 17, cy - 13, 34, 27, 3), fill=b), G(path([(cx - 13, cy + 10), (cx - 3, cy - 2), (cx + 3, cy + 5), (cx + 8, cy), (cx + 13, cy + 10)], closed=True), fill="#fbd968"), G(ell(cx + 7, cy - 6, 6), fill="#fbd968")]
    if inner == "doc":
        g += [G(rect(cx - 12, cy - 17, 24, 34, 3), fill=b), G(rect(cx - 7, cy - 7, 14, 2.5, 1), rect(cx - 7, cy, 14, 2.5, 1), rect(cx - 7, cy + 7, 10, 2.5, 1), fill="#fbd968")]
    if inner == "gear":
        teeth = [path([(cx + 16 * math.cos(math.radians(a)), cy + 16 * math.sin(math.radians(a))), (cx + 16 * math.cos(math.radians(a + 360 / 16)), cy + 16 * math.sin(math.radians(a + 360 / 16)))]) for a in range(0, 360, 45)]
        g += [G(*teeth, stroke=b, sw=7, cap=1), G(ell(cx, cy, 26), fill=b), G(ell(cx, cy, 10), fill="#fbd968")]
    return g


def scene_explorer():
    op = 170
    ink = "#1f2328"
    L_ = [L("bg", G(rect(0, 0, W, H), fill="#f3f7fb"))]
    L_.append(L("window", G(rect(2, 2, 796, 446, 12), fill="white", stroke="#d3dbe6", sw=2), G(rect(3, 3, 794, 28, 11), rect(3, 20, 794, 11), fill="#eaf1f8"),
                G(path([(686, 15), (702, 15)]), rect(729, 8, 14, 14, 2), path([(771, 8), (785, 22)]), path([(785, 8), (771, 22)]), stroke="#333", sw=1.8),
                G(path([(16, 49), (34, 49)]), path([(24, 41), (16, 49), (24, 57)]), path([(101, 58), (101, 40)]), path([(93, 48), (101, 40), (109, 48)]), stroke="#333", sw=2.2),
                G(path([(54, 49), (72, 49)]), path([(64, 41), (72, 49), (64, 57)]), stroke="#b7bec8", sw=2.2),
                G(rect(617, 33, 170, 32, 6), stroke="#d3dbe6", sw=1.5), G(ell(631, 47, 12), path([(626.5, 51.5), (622, 56)]), stroke="#555", sw=1.8)))
    tb = [G(ell(33, 92, 22), path([(33, 86), (33, 98)]), path([(27, 92), (39, 92)]), path([(49, 90), (52, 93), (55, 90)]), stroke="#4a5563", sw=1.8),
          G(ell(98, 99, 8), ell(110, 99, 8), path([(100, 95), (110, 82)]), path([(108, 95), (98, 82)]), stroke="#6d8fb5", sw=1.8),
          G(rect(146, 84, 12, 15, 2.5), rect(151, 89, 12, 15, 2.5), stroke="#6d8fb5", sw=1.8),
          G(rect(196, 85, 14, 17, 2.5), rect(199, 82, 8, 4, 1.5), stroke="#6d8fb5", sw=1.8),
          G(path([(248, 101), (248, 90), (262, 90)]), path([(256, 84), (262, 90), (256, 96)]), stroke="#6d8fb5", sw=1.8),
          G(rect(299, 86, 13, 16, 2.5), path([(295, 85), (316, 85)]), path([(303, 82), (308, 82)]), stroke="#6d8fb5", sw=1.8),
          G(ell(355, 92, 3.5), ell(364, 92, 3.5), ell(373, 92, 3.5), fill="#4a5563"),
          G(path([(77, 80), (77, 104)]), path([(336, 80), (336, 104)]), stroke="#e3e8ef", sw=1.5),
          G(path([(3, 115), (797, 115)]), path([(136, 115), (136, 447)]), stroke="#e3e8ef", sw=1.5)]
    L_.append(L("toolbar", *tb))
    side = [G(rect(4, 123, 130, 31, 5), fill="#d6e6fb"), G(path([(31, 146), (31, 137), (38, 131), (45, 137), (45, 146)], closed=True), fill="#f08a3c"),
            G(rect(31, 166, 15, 14, 2), fill="#3d86d9"), G(path([(33, 178), (38, 172), (42, 176), (44, 174), (46, 178)], closed=True), fill="#bcd8f5"),
            G(ell(38, 210, 22, 11), ell(33, 207, 11), ell(42, 204, 13), fill="#3a8ee6"),
            G(rect(29, 238, 19, 13, 2), fill="#27a7e0"), G(rect(35, 252, 7, 4), fill="#555"),
            G(rect(29, 279, 19, 7, 2), fill="#7d8794"), G(ell(44, 282.5, 3), fill="#8fe38f"),
            G(ell(35, 312, 13), fill="#4aa3df"), G(rect(36, 314, 13, 10, 2), fill="#27a7e0")]
    L_.append(L("sidebar", *side))
    L_.append(L("folders", *(folder_icon(167, 141) + folder_icon(293, 141, "img") + folder_icon(420, 141, "doc") + folder_icon(544, 141, "gear"))))
    sheets = []
    for x in (176, 300, 426):
        sheets += [G(path([(x, 244), (x + 52, 244), (x + 68, 260), (x + 68, 330), (x, 330)], closed=True), fill="white", stroke="#cfd6df", sw=1.8),
                   G(path([(x + 52, 244), (x + 52, 260), (x + 68, 260)]), stroke="#cfd6df", sw=1.8)]
    def shield(cx, cy, c, digit):
        mark = [(cx + 9, cy - 13), (cx - 9, cy - 13), (cx - 8, cy - 2), (cx + 8, cy - 2), (cx + 7, cy + 10), (cx, cy + 13), (cx - 7, cy + 10)] if digit == 5 else                [(cx - 9, cy - 13), (cx + 9, cy - 13), (cx + 1, cy - 3), (cx + 8, cy - 2), (cx + 7, cy + 10), (cx, cy + 13), (cx - 7, cy + 10)]
        return [G(path([(cx - 20, cy - 23), (cx + 20, cy - 23), (cx + 17, cy + 17), (cx, cy + 24), (cx - 17, cy + 17)], closed=True), fill=c),
                G(path(mark), stroke="white", sw=3.2, cap=1)]
    sheets += shield(210, 289, "#e44d26", 5) + shield(334, 289, "#2965f1", 3)
    sheets += [G(path([(450, 278), (440, 289), (450, 300)]), path([(470, 278), (480, 289), (470, 300)]), path([(464, 274), (456, 304)]), stroke="#5f6b7a", sw=3.2)]
    L_.append(L("files", *sheets))
    # address bar: path -> click selects it -> type cmd -> Enter
    L_.append(L("address", G(rect(122, 33, 485, 32, 6), fill="white", stroke="#c9d1db", sw=1.5), G(rect(132, 41, 7, 4, 1.5), fill="#f0b42e"), G(rect(132, 43, 16, 12, 2.5), fill="#f6c643"),
                G(path([(583, 46), (588, 51), (593, 46)]), stroke="#555", sw=1.8)))
    L_.append(L("address-focus", G(rect(122, 33, 485, 32, 6), stroke="#2f6fd6", sw=2.5), o=A((0, 0, "h"), (16, 100, "h"), (150, 100), (160, 0))))
    L_.append(L("path-select", G(rect(154, 41, 190, 17, 3), fill="#cfe1fb"), o=A((0, 0, "h"), (18, 100, "h"), (28, 0, "h"), (170, 0))))
    L_.append(L("path-text", G(rect(158, 46, 32, 7, 3.5), rect(206, 46, 70, 7, 3.5), rect(292, 46, 46, 7, 3.5), fill="#7f8a98"),
                G(path([(196, 46), (199.5, 49.5), (196, 53)]), path([(282, 46), (285.5, 49.5), (282, 53)]), stroke="#7f8a98", sw=1.6),
                o=A((0, 100, "h"), (28, 0, "h"), (164, 100, "h"), (170, 100))))
    letter_c = path(arc_pts(164, 51.5, 5.5, 40, 320, 12))
    letter_m = path([(172, 57), (172, 46), (172, 49.5), (174.5, 46.5), (177.5, 46), (179.5, 48.5), (179.5, 57), (179.5, 48.5), (182, 46), (185, 46.5), (187, 49), (187, 57)], smooth=False)
    letter_d = [ell(196, 51.5, 11), path([(201.5, 41), (201.5, 57)])]
    L_.append(L("type-c", G(letter_c, stroke=ink, sw=2.6), o=A((0, 0, "h"), (34, 100, "h"), (156, 0, "h"), (170, 0))))
    L_.append(L("type-m", G(letter_m, stroke=ink, sw=2.6), o=A((0, 0, "h"), (42, 100, "h"), (156, 0, "h"), (170, 0))))
    L_.append(L("type-d", G(*letter_d, stroke=ink, sw=2.6), o=A((0, 0, "h"), (50, 100, "h"), (156, 0, "h"), (170, 0))))
    caret = [(0, [158, 49], "h"), (34, [172, 49], "h"), (42, [192, 49], "h"), (50, [207, 49], "h"), (170, [207, 49])]
    blink = [(0, 0, "h"), (18, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(58, 150, 8))] + [(150, 0, "h"), (170, 0)]
    L_.append(L("caret", G(rect(-1, -10, 2, 20, 1), fill=ink), p=A(*caret, mode="h"), o=A(*blink, mode="h")))
    L_.append(L("enter-key", G(rect(-28, -15, 56, 30, 7), fill="dg"), G(path([(12, -7), (12, 3), (-8, 3)]), stroke="white", sw=2.6), G(arrow_head((-13, 3), (-1, 0), 8), fill="white"),
                p=(250, 49), s=A((0, 0, "h"), (58, 80), (62, 106), (66, 95), (72, 100), (80, 0)), o=A((0, 0, "h"), (58, 100, "h"), (78, 0))))
    # Command Prompt opens with that folder as the current place
    cmdw = [G(rect(300, 176, 470, 232, 10), fill="#0c0c0c"), G(rect(300, 176, 470, 30, 10), rect(300, 192, 470, 14), fill="#2b2b2b"),
            G(rect(312, 184, 15, 13, 2.5), fill="#555"), G(path([(316, 188), (319.5, 190.5), (316, 193)]), stroke="#ddd", sw=1.4),
            G(rect(320, 226, 150, 7, 3.5), rect(320, 242, 110, 7, 3.5), fill="#bdbdbd")]
    L_.append(L("cmd-window", *cmdw, p=(535, 292), a=(535, 292), s=A((0, 88, "h"), (74, 88), (84, 100)), o=A((0, 0, "h"), (74, 0), (82, 100), (152, 100), (160, 0))))
    L_.append(L("cmd-path", G(rect(0, -4.5, 200, 9, 4.5), fill="#e6e6e6"), G(path([(207, -5), (213, 0), (207, 5)]), stroke="#e6e6e6", sw=2.2), p=(320, 276),
                s=A((0, [0, 100], "h"), (84, [0, 100], "l"), (100, [100, 100], "h"), (170, [100, 100])), o=A((0, 0, "h"), (84, 100, "h"), (152, 100), (160, 0))))
    blink2 = [(0, 0, "h"), (100, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(106, 152, 8))] + [(152, 0, "h"), (170, 0)]
    L_.append(L("cmd-cursor", G(rect(0, 0, 11, 3.5, 1), fill="#e6e6e6"), p=(540, 279), o=A(*blink2, mode="h")))
    L_.append(L("folder-link", G(rect(161, 136, 105, 84, 9), stroke="#2f6fd6", sw=2.5), o=A((0, 0, "h"), (84, 0), (90, 100), (142, 100), (150, 0))))
    build("explorer-cmd-guide", L_, op, 120, "エクスプローラーのアドレスバーに cmd と入力し、そのフォルダでコマンドプロンプトを開くイメージ")


if __name__ == "__main__":
    scene_terminal()
    scene_local_remote()
    scene_history()
    scene_explorer()
