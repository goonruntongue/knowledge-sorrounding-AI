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
# 1. Terminal: typing on the laptop sends commands; each line appears in the terminal.
# =====================================================================
def scene_terminal():
    op = 150
    lines = [(12, 40, 185, 110, "mg"), (50, 78, 220, 150, "blue"), (88, 116, 255, 110, "lg")]
    L_ = [bg()]
    # laptop screen
    hills_back = [(127, 214), (170, 188), (215, 176), (262, 198), (305, 186), (353, 200)]
    hills_front = [(127, 236), (180, 214), (228, 208), (282, 238), (320, 226), (353, 218)]
    L_.append(L("laptop-screen",
                G(rect(113, 103, 254, 164, 14), fill="dg"),
                G(rect(126, 116, 228, 138, 4), fill="#dff1f1"),
                G(ell(318, 146, 30), fill="white"),
                G(path(hills_back + [(353, 254), (127, 254)], closed=True), fill="lg"),
                G(path(hills_front + [(353, 254), (127, 254)], closed=True), fill="mg"),
                G(ell(146, 226, 14, 30), ell(166, 220, 17, 40), fill="#4d8a70")))
    keys = []
    for row, (y, inset) in enumerate([(277, 14), (289, 10), (301, 6)]):
        x0, x1 = 112 + inset * 0 - row * 4, 368 + row * 4
        n = 12
        kw = (x1 - x0 - (n - 1) * 4) / n
        for k in range(n):
            keys.append(rect(x0 + k * (kw + 4), y, kw, 8, 2))
    L_.append(L("keyboard",
                G(path([(106, 268), (374, 268), (402, 330), (78, 330)], closed=True), fill="gray"),
                G(rect(76, 328, 328, 12, 6), fill="grayd"),
                G(*keys, fill="key"),
                G(rect(206, 313, 70, 12, 4), fill="#97a2b3")))
    # key flashes + hands (two hands typing alternately while a line is being typed)
    taps_l, taps_r = [], []
    for s, e, *_ in lines:
        t = s
        while t + 5 <= e:
            taps_l.append(t)
            taps_r.append(t + 4)
            t += 8
    def tap_anim(taps, y0):
        ks = [(0, [0, y0], "l")]
        for t in taps:
            ks += [(t, [0, y0], "l"), (t + 2, [0, y0 + 6], "l"), (t + 5, [0, y0], "l")]
        return A(*ks, mode="l")
    def hand(cx, mirror):
        m = -1 if mirror else 1
        fingers = [rect(cx + m * dx - 7, 262, 14, 34, 7) for dx in (-26, -11, 4, 19)]
        return [G(path([(cx - 48 * m, 330), (cx + 44 * m, 330), (cx + 72 * m, 450), (cx - 96 * m, 450)], closed=True), fill="dg2"),
                G(*fingers, fill="skin"),
                G(ell(cx, 300, 84, 58), fill="skin"),
                G(path([(cx - 12 * m, 292), (cx + 4 * m, 286)]), path([(cx + 6 * m, 294), (cx + 20 * m, 289)]), stroke="skind", sw=2.5),
                G(ell(cx - 44 * m, 312, 34, 24), fill="skin")]
    L_.append(L("key-flash-l", G(rect(150, 289, 18, 8, 2), fill="or"), o=A((0, 0, "h"), *[k for t in taps_l for k in ((t, 0), (t + 2, 100), (t + 6, 0))], mode="l")))
    L_.append(L("key-flash-r", G(rect(282, 277, 18, 8, 2), fill="or"), o=A((0, 0, "h"), *[k for t in taps_r for k in ((t, 0), (t + 2, 100), (t + 6, 0))], mode="l")))
    L_.append(L("hand-left", *hand(178, False), p=tap_anim(taps_l, 0)))
    L_.append(L("hand-right", *hand(304, True), p=tap_anim(taps_r, 0)))
    # motion lines near the hands
    L_.append(L("tap-lines", G(path([(52, 262), (70, 272)]), path([(46, 292), (68, 294)]), path([(56, 322), (72, 314)]), stroke="or", sw=5),
                o=A((0, 0, "h"), *[k for s, e, *_ in lines for k in ((s, 0), (s + 4, 100), (e - 4, 100), (e, 0))])))
    # orange arrow laptop -> terminal (drawn while typing starts)
    arrow = path([(352, 294), (468, 226)])
    arrow["o"] = [[18, -58], [0, 0]]
    arrow["i"] = [[0, 0], [-62, 2]]
    L_.append(L("arrow", G(arrow, stroke="or", sw=8, trim=A((0, 0, "h"), (8, 0), (24, 100), (140, 100), (148, 100))),
                G(path([(452, 210), (470, 226), (452, 242)]), stroke="or", sw=8, o=A((0, 0, "h"), (22, 0), (26, 100))),
                o=A((0, 100, "h"), (140, 100), (148, 0))))
    # terminal window
    L_.append(L("terminal", G(rect(488, 118, 274, 206, 16), fill="#113a31"),
                G(rect(488, 118, 274, 36, 16), rect(488, 138, 274, 16), fill="#1c4a3f"),
                G(ell(510, 136, 13), fill="or"), G(ell(532, 136, 13), fill="mg"), G(ell(554, 136, 13), fill="lg")))
    ys = [185, 220, 255, 290]
    for n, y in enumerate(ys):
        start = lines[n][0] if n < 3 else 118
        L_.append(L("prompt%d" % n, G(path([(507, y - 8), (515, y), (507, y + 8)]), stroke="white", sw=4),
                    o=A((0, 0, "h"), (start, 100, "h"), (140, 100), (148, 0))))
    for n, (s, e, y, w, c) in enumerate(lines):
        L_.append(L("line%d" % n, G(rect(0, -7, w, 14, 7), fill=c), p=(530, y),
                    s=A((0, [0, 100], "h"), (s, [0, 100], "l"), (e, [100, 100], "h"), (150, [100, 100])),
                    o=A((0, 100, "h"), (140, 100), (148, 0))))
    cur = [(0, [532, 185], "h")]
    for n, (s, e, y, w, c) in enumerate(lines):
        cur += [(s, [532, y], "l"), (e, [530 + w + 8, y], "h")]
    cur += [(118, [532, 290], "h"), (150, [532, 290])]
    blink = [(0, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(124, 150, 7))] + [(150, 100)]
    L_.append(L("cursor", G(rect(-3, -12, 7, 24, 2), fill="or"), p=A(*cur, mode="l"), o=A(*blink, mode="h")))
    # sparkle when the last command finishes
    L_.append(L("sparkle", G(path([(780, 70), (776, 98)]), path([(800, 104), (774, 116)]), path([(804, 142), (778, 138)]), stroke="mg", sw=6),
                p=(-12, 10), o=A((0, 0, "h"), (116, 0), (122, 100), (140, 100), (148, 0))))
    build("terminal-guide", L_, op, 130, "ノートPCで入力したコマンドがターミナルに1行ずつ表示されるイメージ")


# =====================================================================
# 2. Local and remote: commit stays in the PC; push sends to GitHub; pull brings changes back.
# =====================================================================
def doc_card(x, y, w=100, h=130, lines=("mg", "blue", "or")):
    return [G(rect(x, y, w, h, 9), fill="white"),
            G(path([(x + w - 22, y), (x + w, y + 22), (x + w - 22, y + 22)], closed=True), fill="lg"),
            *[G(rect(x + 14, y + 30 + k * 18, [55, 70, 50][k] * w / 100, 8, 4), fill=c) for k, c in enumerate(lines)]]


def scene_local_remote():
    op = 150
    L_ = [bg()]
    L_.append(L("docs-left", G(rect(36, 214, 96, 126, 9), fill="mg"), G(rect(46, 222, 96, 126, 9), fill="blue"), *doc_card(58, 232)))
    L_.append(L("laptop", G(rect(128, 148, 220, 154, 12), fill="dg"), G(rect(141, 161, 194, 124, 3), fill="white"),
                G(path([(116, 302), (360, 302), (376, 326), (100, 326)], closed=True), fill="#1f6b57"), G(rect(204, 305, 68, 8, 3), fill="dg")))
    # folder on the laptop screen; a small "commit" check appears inside the PC first
    L_.append(L("folder", G(rect(0, -34, 36, 18, 5), fill="#2e7a64"), G(rect(0, -26, 84, 60, 8), fill="#3f8f78"), G(rect(0, -14, 84, 48, 8), fill="#5aa88f"),
                p=(196, 226), s=A((0, 100, "h"), (8, 100), (14, 108), (22, 100))))
    L_.append(L("commit-badge", G(ell(0, 0, 30), fill="or"), G(path([(-7, 0), (-2, 6), (8, -6)]), stroke="white", sw=4),
                p=(300, 196), s=A((0, 0, "h"), (8, 0), (16, 115), (22, 100), (60, 100), (66, 0), (150, 0)), o=A((0, 100, "h"), (60, 100), (66, 0))))
    # cloud with servers and lock
    L_.append(L("cloud", G(ell(560, 262, 170, 150), ell(650, 210, 196, 186), ell(726, 262, 150, 132), rect(520, 262, 280, 76, 38), fill="#6fb0e0")))
    servers = []
    for k, (y, c) in enumerate([(206, "mg"), (246, "blue"), (286, "or")]):
        servers.append(L("server%d" % k, G(rect(588, y, 112, 34, 7), fill="dg"), G(rect(600, y + 14, 40, 6, 3), fill="mg" if k < 2 else "#c9b24a"),
                         G(ell(662, y + 17, 11), fill=c), G(ell(682, y + 17, 11), fill="white")))
    L_ += servers
    L_.append(L("server-blink", G(ell(682, 223, 16), ell(682, 263, 16), ell(682, 303, 16), fill="or"),
                o=A((0, 0, "h"), (58, 0), (62, 100), (70, 0), (74, 100), (82, 0))))
    L_.append(L("lock", G(path(arc_pts(741, 216, 13, 180, 360, 10)), stroke="white", sw=6), G(rect(716, 212, 50, 44, 8), fill="dg"),
                G(ell(741, 229, 10), rect(738, 230, 6, 14, 2), fill="white")))
    L_.append(L("docs-right", G(rect(736, 290, 84, 112, 9), fill="blue"), *doc_card(720, 300, 88, 112)))
    L_.append(L("pulled-line", G(rect(734, 386, 40, 8, 4), fill="teal"), o=A((0, 0, "h"), (96, 0), (104, 100), (150, 100))))
    # arrows
    L_.append(L("arrow-push", G(path([(500, 190), (538, 190)]), path([(526, 178), (540, 190), (526, 202)]), stroke="teal", sw=9),
                s=A((0, 100, "h"), (22, 100), (28, 115), (34, 100)), p=(519, 190), a=(519, 190)))
    L_.append(L("arrow-pull", G(path([(400, 256), (362, 256)]), path([(374, 244), (360, 256), (374, 268)]), stroke="teal", sw=9),
                s=A((0, 100, "h"), (86, 100), (92, 115), (98, 100)), p=(381, 256), a=(381, 256)))
    colors = ["teal", "blue", "or", "teal", "blue"]
    # push: dots flow right while the push happens; pull: dots flow left afterwards
    for k in range(5):
        L_.append(L("push-dot%d" % k, G(ell(0, 0, 14), fill=colors[k]),
                    p=(375 + 25 * k, 190),
                    o=A((0, 35, "h"), (22 + k * 4, 35), (26 + k * 4, 100), (46 + k * 4, 100), (56 + k * 4, 35))))
        L_.append(L("pull-dot%d" % k, G(ell(0, 0, 14), fill=colors[::-1][k]),
                    p=(515 - 25 * k, 256),
                    o=A((0, 35, "h"), (86 + k * 4, 35), (90 + k * 4, 100), (110 + k * 4, 100), (120 + k * 4, 35))))
    # a change travels: laptop -> cloud (push), then cloud -> laptop (pull)
    push_path = lambda t: bez((250, 190), (430, 110), (640, 176), max(0, min(1, (t - 24) / 32)))
    pull_path = lambda t: bez((650, 330), (450, 400), (250, 300), max(0, min(1, (t - 88) / 32)))
    mini = [G(rect(-20, -25, 40, 50, 5), fill="white"), G(rect(-12, -12, 24, 5, 2), rect(-12, -2, 18, 5, 2), fill="mg"), G(rect(-12, 8, 20, 5, 2), fill="or")]
    L_.append(L("push-doc", *mini, p=sampled(push_path, 0, 150, 2), s=A((0, 70, "h"), (24, 70), (40, 90), (56, 60)),
                o=A((0, 0, "h"), (24, 0), (28, 100), (52, 100), (58, 0))))
    mini2 = [G(rect(-20, -25, 40, 50, 5), fill="white"), G(rect(-12, -12, 24, 5, 2), fill="teal"), G(rect(-12, -2, 18, 5, 2), rect(-12, 8, 20, 5, 2), fill="blue")]
    L_.append(L("pull-doc", *mini2, p=sampled(pull_path, 0, 150, 2), s=A((0, 60, "h"), (88, 60), (104, 90), (120, 70)),
                o=A((0, 0, "h"), (88, 0), (92, 100), (116, 100), (122, 0))))
    L_.append(L("folder-glow", G(rect(186, 186, 104, 76, 12), stroke="or", sw=4), o=A((0, 0, "h"), (118, 0), (122, 100), (136, 100), (144, 0))))
    build("local-remote-guide", L_, op, 40, "PC内のフォルダとGitHubのリポジトリの間を、pushとpullで変更が行き来するイメージ")


# =====================================================================
# 3. History and restore: commits pile up; an older version is taken back into the working folder.
# =====================================================================
def version_card(x, y, sun, mt, pick=False):
    w, h = 118, 150
    return [G(rect(x, y, w, h, 10), fill="white", stroke="dg" if pick else "#b9dccb", sw=5 if pick else 3),
            G(path([(x + w - 22, y), (x + w, y + 22), (x + w - 22, y + 22)], closed=True), fill="#b9dccb"),
            G(rect(x + 12, y + 16, w - 24, 72, 4), fill="#e8f2f8"),
            G(ell(x + w - 36, y + 38, 22), fill=sun),
            G(path([(x + 16, y + 86), (x + 44, y + 48), (x + 70, y + 86)], closed=True), fill=mt),
            G(path([(x + 54, y + 86), (x + 76, y + 62), (x + 100, y + 86)], closed=True), fill=mt, fo=70),
            G(rect(x + 14, y + 102, 80, 9, 4), rect(x + 14, y + 120, 56, 9, 4), fill="#a9cdbd")]


def scene_history():
    op = 160
    L_ = [bg()]
    cards = [(32, 120, "#a9c8d6", "#8fb0d4"), (180, 100, "or", "#3d7f73"), (328, 90, "blue", "#3f78b8"), (476, 78, "or", "#1f5a4a")]
    pops = [6, 18, 30, 42]
    for k, (x, y, sun, mt) in enumerate(cards):
        t = pops[k]
        L_.append(L("version%d" % k, *version_card(x, y, sun, mt), p=(x + 59, y + 75), a=(x + 59, y + 75),
                    s=A((0, 60, "h"), (t, 60), (t + 8, 104), (t + 12, 100)), o=A((0, 0, "h"), (t, 0), (t + 5, 100))))
    for k in range(3):
        x0, y0 = cards[k][0] + 70, cards[k][1] - 10
        x1, y1 = cards[k + 1][0] + 40, cards[k + 1][1] - 14
        a = path([(x0, y0), (x1, y1)])
        a["o"] = [[20, -44], [0, 0]]
        a["i"] = [[0, 0], [-30, -30]]
        t = pops[k + 1]
        L_.append(L("step-arrow%d" % k, G(a, stroke="teal", sw=6, trim=A((0, 0, "h"), (t - 4, 0), (t + 4, 100))),
                    G(path([(x1 - 14, y1 - 12), (x1, y1), (x1 - 16, y1 + 4)]), stroke="teal", sw=6, o=A((0, 0, "h"), (t + 3, 0), (t + 5, 100)))))
    # locked box = the repository that keeps every commit
    L_.append(L("to-box", G(path([(600, 120), (640, 108), (678, 140)], smooth=True), stroke="teal", sw=7, trim=A((0, 0, "h"), (50, 0), (60, 100))),
                G(path([(664, 134), (680, 142), (670, 156)]), stroke="teal", sw=7, o=A((0, 0, "h"), (58, 0), (60, 100)))))
    L_.append(L("box", G(path([(684, 120), (770, 108), (792, 128), (704, 142)], closed=True), fill="#2f8a6f"),
                G(rect(700, 140, 94, 92, 8), fill="#1f6b57"),
                G(path(arc_pts(747, 176, 11, 180, 360, 8)), stroke="#eef5f0", sw=5), G(rect(733, 174, 28, 26, 5), fill="#eef5f0"), G(ell(747, 185, 7), fill="dg"),
                p=(747, 232), a=(747, 232), s=A((0, 100, "h"), (60, 100), (64, 106), (70, 100))))
    L_.append(L("box-spark", G(path([(726, 84), (716, 72)]), path([(748, 78), (748, 62)]), path([(770, 84), (780, 72)]), stroke="or", sw=5),
                o=A((0, 0, "h"), (60, 0), (64, 100), (80, 100), (86, 0))))
    # desk, plant, laptop, person (the person restoring a version)
    L_.append(L("desk", G(rect(360, 404, 430, 16, 8), fill="#cfe5da")))
    L_.append(L("plant", G(ell(392, 362, 22, 34), ell(410, 356, 22, 38), ell(426, 368, 22, 30), fill="#2f7a63"), G(rect(386, 378, 44, 28, 5), fill="white")))
    L_.append(L("person", G(path([(560, 404), (572, 330), (620, 312), (668, 330), (684, 404)], closed=True, smooth=False), fill="#4a86c0"),
                G(ell(620, 278, 64, 68), fill="skin"),
                G(path([(588, 272), (594, 246), (620, 236), (648, 246), (654, 272), (640, 256), (606, 258)], closed=True, smooth=True), fill="dg"),
                G(ell(608, 280, 6), ell(630, 280, 6), fill="dg"),
                G(path([(612, 296), (618, 299), (625, 296)]), stroke="#c96b4a", sw=2.5),
                G(ell(560, 390, 34, 18), fill="skin")))
    L_.append(L("laptop", G(path([(450, 326), (540, 326), (560, 398), (470, 398)], closed=True), fill="#aebfd6"),
                G(rect(462, 396, 112, 8, 3), fill="#8d9fba"), G(ell(506, 362, 16), fill="white")))
    # restore: version 2 is chosen and its content comes back to the working folder
    L_.append(L("pick-frame", G(rect(176, 96, 126, 158, 12), stroke="dg", sw=6), o=A((0, 0, "h"), (74, 0), (80, 100), (140, 100), (148, 0))))
    curve = path([(236, 262), (292, 362), (452, 372)], smooth=True)
    L_.append(L("restore-arrow", G(curve, stroke="blued", sw=8, trim=A((0, 0, "h"), (82, 0), (100, 100), (140, 100), (148, 100))),
                G(path([(434, 356), (454, 372), (432, 386)]), stroke="blued", sw=8, o=A((0, 0, "h"), (98, 0), (100, 100))),
                G(path([(222, 280), (236, 262), (250, 280)]), stroke="blued", sw=8, o=A((0, 0, "h"), (82, 0), (84, 100))),
                o=A((0, 100, "h"), (140, 100), (148, 0))))
    route = lambda t: bez((239, 175), (300, 380), (500, 360), max(0, min(1, (t - 100) / 26)))
    L_.append(L("restored-copy", *version_card(180, 100, "or", "#3d7f73"), p=sampled(route, 0, 160, 2), a=(239, 175),
                s=A((0, 100, "h"), (100, 100), (126, 34), (160, 34)), o=A((0, 0, "h"), (100, 0), (104, 100), (130, 100), (136, 0))))
    L_.append(L("laptop-glow", G(ell(506, 362, 44), fill="white", fo=70), s=A((0, 60, "h"), (126, 60), (134, 120), (144, 100)),
                p=(506, 362), a=(506, 362), o=A((0, 0, "h"), (126, 0), (130, 100), (146, 100), (154, 0))))
    build("history-restore-guide", L_, op, 110, "コミットした過去の版から1つを選び、作業フォルダへ取り出すイメージ")


# =====================================================================
# 4. Explorer: type cmd in the address bar and press Enter; Command Prompt opens in that folder.
# =====================================================================
def folder_icon(x, y, inner=None):
    g = [G(rect(x, y, 40, 16, 5), fill="#f0b42e"), G(rect(x, y + 10, 104, 70, 8), fill="#f6c643"), G(rect(x, y + 20, 104, 60, 8), fill="#fbd968")]
    cx, cy = x + 52, y + 50
    if inner == "img":
        g += [G(rect(cx - 20, cy - 16, 40, 32, 4), fill="#c99a3a"), G(path([(cx - 16, cy + 12), (cx - 4, cy - 2), (cx + 4, cy + 6), (cx + 10, cy), (cx + 16, cy + 12)], closed=True), fill="#fbd968")]
    if inner == "doc":
        g += [G(rect(cx - 14, cy - 20, 28, 40, 4), fill="#c99a3a"), G(rect(cx - 8, cy - 8, 16, 3, 1), rect(cx - 8, cy, 16, 3, 1), rect(cx - 8, cy + 8, 12, 3, 1), fill="#fbd968")]
    if inner == "gear":
        g += [G(ell(cx, cy, 34), fill="#c99a3a"), G(ell(cx, cy, 12), fill="#fbd968")]
    return g


def letter_c(x, y):
    return path(arc_pts(x + 8, y - 8, 8, 40, 320, 10))


def letter_m(x, y):
    return path([(x, y), (x, y - 16), (x, y - 11), (x + 3, y - 15), (x + 7, y - 16), (x + 10, y - 13), (x + 10, y), (x + 10, y - 13), (x + 13, y - 16), (x + 17, y - 15), (x + 20, y - 12), (x + 20, y)])


def scene_explorer():
    op = 170
    L_ = [L("bg", G(rect(0, 0, W, H), fill="#f5f8fc"))]
    L_.append(L("window", G(rect(16, 16, 768, 418, 14), fill="white", stroke="#d3dbe6", sw=2), G(rect(17, 17, 766, 40, 13), rect(17, 40, 766, 18), fill="#eaf1f8"),
                G(path([(646, 37), (662, 37)]), rect(700, 30, 13, 13, 2), path([(744, 30), (757, 43)]), path([(757, 30), (744, 43)]), stroke="#333", sw=2),
                G(path([(38, 80), (60, 80)]), path([(48, 70), (38, 80), (48, 90)]), path([(132, 90), (132, 70)]), path([(122, 80), (132, 70), (142, 80)]), stroke="#333", sw=2.5),
                G(path([(80, 80), (102, 80)]), path([(92, 70), (102, 80), (92, 90)]), stroke="#b7bec8", sw=2.5),
                G(rect(600, 60, 170, 40, 8), stroke="#d3dbe6", sw=2), G(ell(640, 78, 14), path([(645, 84), (651, 90)]), stroke="#555", sw=2)))
    # toolbar and sidebar
    tb = [G(ell(46, 128, 22), path([(46, 121), (46, 135)]), path([(39, 128), (53, 128)]), stroke="#4a5563", sw=2),
          G(ell(100, 136, 9), ell(114, 136, 9), path([(102, 131), (112, 118)]), path([(112, 131), (102, 118)]), stroke="#6d8fb5", sw=2),
          G(rect(150, 118, 14, 18, 3), rect(156, 124, 14, 18, 3), stroke="#6d8fb5", sw=2),
          G(rect(206, 120, 16, 20, 3), stroke="#6d8fb5", sw=2), G(path([(252, 136), (252, 124), (268, 124)]), path([(262, 118), (268, 124), (262, 130)]), stroke="#6d8fb5", sw=2),
          G(rect(300, 122, 14, 18, 3), path([(296, 121), (318, 121)]), stroke="#6d8fb5", sw=2),
          G(ell(352, 128, 4), ell(362, 128, 4), ell(372, 128, 4), fill="#4a5563"),
          G(path([(16, 154), (784, 154)]), path([(166, 154), (166, 432)]), stroke="#e3e8ef", sw=2)]
    L_.append(L("toolbar", *tb))
    side = [G(rect(26, 164, 130, 42, 7), fill="#d6e6fb"), G(path([(78, 190), (78, 180), (91, 170), (104, 180), (104, 190)], closed=True), fill="#f08a3c"),
            G(rect(80, 222, 24, 20, 3), fill="#3d86d9"), G(ell(92, 278, 30, 16), ell(84, 274, 16), ell(98, 270, 18), fill="#3a8ee6"),
            G(rect(78, 316, 28, 20, 3), fill="#27a7e0"), G(rect(88, 336, 8, 6), fill="#555"), G(rect(78, 370, 28, 10, 3), fill="#7d8794")]
    L_.append(L("sidebar", *side))
    files = folder_icon(212, 178) + folder_icon(330, 178, "img") + folder_icon(448, 178, "doc") + folder_icon(566, 178, "gear")
    L_.append(L("folders", *files))
    sheets = []
    for k, x in enumerate([226, 344, 462]):
        sheets += [G(path([(x, 290), (x + 50, 290), (x + 70, 310), (x + 70, 380), (x, 380)], closed=True), fill="white", stroke="#cfd6df", sw=2)]
    sheets += [G(path([(240, 312), (282, 312), (278, 356), (261, 362), (244, 356)], closed=True), fill="#e44d26"), G(path([(250, 322), (272, 322), (270, 344), (261, 348), (252, 344)]), stroke="white", sw=3),
               G(path([(358, 312), (400, 312), (396, 356), (379, 362), (362, 356)], closed=True), fill="#2965f1"), G(path([(368, 322), (390, 322), (388, 344), (379, 348), (370, 344)]), stroke="white", sw=3),
               G(path([(484, 324), (474, 336), (484, 348)]), path([(512, 324), (522, 336), (512, 348)]), path([(502, 320), (494, 352)]), stroke="#5f6b7a", sw=3.5)]
    L_.append(L("files", *sheets))
    # address bar: path shown -> click selects it -> typing replaces it with cmd -> Enter
    L_.append(L("address", G(rect(168, 60, 422, 40, 8), fill="white", stroke="#c9d1db", sw=2), G(rect(182, 71, 26, 18, 4), fill="#f6c643"),
                G(path([(566, 76), (572, 82), (578, 76)]), stroke="#555", sw=2)))
    L_.append(L("address-focus", G(rect(168, 60, 422, 40, 8), stroke="#2f6fd6", sw=3), o=A((0, 0, "h"), (16, 100, "h"), (150, 100), (160, 0))))
    L_.append(L("path-select", G(rect(218, 69, 196, 22, 4), fill="#cfe1fb"), o=A((0, 0, "h"), (18, 100, "h"), (28, 0, "h"), (170, 0))))
    L_.append(L("path-text", G(rect(224, 76, 34, 8, 4), rect(276, 76, 70, 8, 4), rect(364, 76, 44, 8, 4), fill="#7f8a98"),
                G(path([(264, 76), (268, 80), (264, 84)]), path([(352, 76), (356, 80), (352, 84)]), stroke="#7f8a98", sw=2),
                o=A((0, 100, "h"), (28, 0, "h"), (164, 100, "h"), (170, 100))))
    L_.append(L("type-c", G(letter_c(222, 88), stroke="#1f2328", sw=4), o=A((0, 0, "h"), (34, 100, "h"), (156, 0, "h"), (170, 0))))
    L_.append(L("type-m", G(letter_m(244, 88), stroke="#1f2328", sw=4), o=A((0, 0, "h"), (42, 100, "h"), (156, 0, "h"), (170, 0))))
    L_.append(L("type-d", G(ell(279, 80, 16), path([(287, 64), (287, 88)]), stroke="#1f2328", sw=4), o=A((0, 0, "h"), (50, 100, "h"), (156, 0, "h"), (170, 0))))
    caret = [(0, [222, 80], "h"), (34, [240, 80], "h"), (42, [270, 80], "h"), (50, [296, 80], "h"), (170, [296, 80])]
    blink = [(0, 0, "h"), (18, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(58, 150, 8))] + [(150, 0, "h"), (170, 0)]
    L_.append(L("caret", G(rect(-1.5, -12, 3, 24, 1), fill="#1f2328"), p=A(*caret, mode="h"), o=A(*blink, mode="h")))
    L_.append(L("enter-key", G(rect(-34, -18, 68, 36, 8), fill="#123f33"), G(path([(14, -8), (14, 4), (-14, 4)]), path([(-6, -4), (-14, 4), (-6, 12)]), stroke="white", sw=3),
                p=(330, 80), s=A((0, 0, "h"), (58, 80), (62, 105), (66, 95), (72, 100), (80, 0)), o=A((0, 0, "h"), (58, 100, "h"), (78, 0))))
    # Command Prompt opens with that folder as the current place
    cmdw = [G(rect(320, 190, 440, 210, 12), fill="#0c0c0c"), G(rect(320, 190, 440, 32, 12), rect(320, 206, 440, 16), fill="#2b2b2b"),
            G(rect(334, 199, 16, 14, 3), fill="#555"), G(path([(338, 203), (342, 206), (338, 209)]), stroke="#ddd", sw=1.6),
            G(rect(342, 244, 170, 8, 4), rect(342, 262, 120, 8, 4), fill="#bdbdbd")]
    L_.append(L("cmd-window", *cmdw, p=(540, 295), a=(540, 295), s=A((0, 88, "h"), (74, 88), (84, 100)), o=A((0, 0, "h"), (74, 0), (82, 100), (152, 100), (160, 0))))
    L_.append(L("cmd-path", G(rect(0, -5, 196, 10, 5), fill="#e6e6e6"), G(path([(204, -6), (212, 0), (204, 6)]), stroke="#e6e6e6", sw=2.5), p=(342, 300),
                s=A((0, [0, 100], "h"), (84, [0, 100], "l"), (100, [100, 100], "h"), (170, [100, 100])), o=A((0, 0, "h"), (84, 100, "h"), (152, 100), (160, 0))))
    blink2 = [(0, 0, "h"), (100, 100, "h")] + [(t, 0 if k % 2 == 0 else 100, "h") for k, t in enumerate(range(106, 152, 8))] + [(152, 0, "h"), (170, 0)]
    L_.append(L("cmd-cursor", G(rect(0, 0, 12, 4, 1), fill="#e6e6e6"), p=(562, 304), o=A(*blink2, mode="h")))
    L_.append(L("folder-link", G(rect(214, 176, 108, 86, 10), stroke="#2f6fd6", sw=3), o=A((0, 0, "h"), (84, 0), (90, 100), (140, 100), (150, 0))))
    build("explorer-cmd-guide", L_, op, 120, "エクスプローラーのアドレスバーに cmd と入力し、そのフォルダでコマンドプロンプトを開くイメージ")


if __name__ == "__main__":
    scene_terminal()
    scene_local_remote()
    scene_history()
    scene_explorer()
