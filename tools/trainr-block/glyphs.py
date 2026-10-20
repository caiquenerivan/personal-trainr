"""Desenho dos glifos da Trainr Block.

Cada glifo é uma sequência de operações sobre polígonos: ('+', forma) une e
('-', forma) recorta, aplicadas em ordem. Tudo é construído com retas e
cantos chanfrados (estilo bloco universitário), a partir dos parâmetros de
Style — mudar a espessura das hastes ou o chanfro muda a fonte inteira.

Coordenadas em unidades de fonte (1000 por em), linha de base em y=0 e
altura das maiúsculas em style.cap. O x é local ao glifo: o build desloca
cada um para aplicar o espaçamento lateral.
"""

from dataclasses import dataclass, field

from pathops import Path


@dataclass(frozen=True)
class Style:
    name: str
    stem: float = 150  # haste vertical
    bar: float = 125  # barras horizontais (um pouco mais finas: contraste leve)
    serif: float = 34  # quanto a serifa passa da haste, de cada lado
    serif_h: float = 56  # altura da serifa
    chamfer: float = 95  # chanfro externo das letras redondas
    chamfer_in: float = 45  # chanfro interno (contraforma)
    spur: float = 78  # comprimento dos esporões (pontas de C, E, S, T…)
    width: float = 1.0  # multiplicador de largura
    cap: float = 700  # altura das maiúsculas
    side: float = 34  # espaço lateral de cada glifo
    digit_width: float = 520  # algarismos tabulares (todos com a mesma largura)
    # larguras-alvo por letra (contorno inteiro, com serifas); o build ajusta o
    # multiplicador de largura de cada glifo até bater. None = usa `width`.
    target_widths: tuple[tuple[str, float], ...] | None = None
    target_scale: float = 1.0
    two: str = "block"  # desenho do 2: "block" (como S/3/5) ou "diagonal"

    def w(self, base: float) -> float:
        return base * self.width


# Proporção de largura de cada letra (altura de maiúscula 700), medida na
# Backed — a fonte que inspirou o estilo. Só as larguras; o desenho é nosso.
LETTER_WIDTHS = (
    ("A", 542), ("B", 455), ("C", 420), ("D", 455), ("E", 438), ("F", 438), ("G", 420),
    ("H", 490), ("I", 210), ("J", 455), ("K", 508), ("L", 402), ("M", 752), ("N", 578),
    ("O", 420), ("P", 455), ("Q", 455), ("R", 490), ("S", 420), ("T", 525), ("U", 490),
    ("V", 542), ("W", 892), ("X", 560), ("Y", 525), ("Z", 402),
)

Op = tuple[str, Path]


def poly(points) -> Path:
    path = Path()
    path.moveTo(*points[0])
    for point in points[1:]:
        path.lineTo(*point)
    path.close()
    return path


def rect(x0, y0, x1, y1) -> Path:
    return poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])


def octo(x0, y0, x1, y1, c=0.0, tl=None, tr=None, br=None, bl=None) -> Path:
    """Retângulo com cantos chanfrados (cada canto pode ter seu chanfro)."""
    tl, tr, br, bl = (c if v is None else v for v in (tl, tr, br, bl))
    limit = min(x1 - x0, y1 - y0) / 2
    tl, tr, br, bl = (min(v, limit) for v in (tl, tr, br, bl))
    pts = [
        (x0 + bl, y0), (x1 - br, y0), (x1, y0 + br), (x1, y1 - tr),
        (x1 - tr, y1), (x0 + tl, y1), (x0, y1 - tl), (x0, y0 + bl),
    ]
    clean = []
    for p in pts:
        if not clean or (abs(p[0] - clean[-1][0]) > 1e-6 or abs(p[1] - clean[-1][1]) > 1e-6):
            clean.append(p)
    if len(clean) > 1 and abs(clean[0][0] - clean[-1][0]) < 1e-6 and abs(clean[0][1] - clean[-1][1]) < 1e-6:
        clean.pop()
    return poly(clean)


def stroke(x0, y0, x1, y1, thickness) -> Path:
    """Diagonal com espessura medida na horizontal (pontas retas em y0/y1)."""
    h = thickness / 2
    return poly([(x0 - h, y0), (x0 + h, y0), (x1 + h, y1), (x1 - h, y1)])


@dataclass
class Glyph:
    ops: list[Op] = field(default_factory=list)
    # largura fixa (algarismos tabulares); None = largura pela forma
    advance: float | None = None
    # centro horizontal onde os acentos ficam (padrão: centro da forma)
    accent_x: float | None = None

    def add(self, *paths):
        self.ops.extend(("+", p) for p in paths)
        return self

    def cut(self, *paths):
        self.ops.extend(("-", p) for p in paths)
        return self


# ─── Peças repetidas ────────────────────────────────────────────────────────


def slab_bottom(s: Style, x0, x1, left=True, right=True) -> Path:
    return rect(x0 - (s.serif if left else 0), 0, x1 + (s.serif if right else 0), s.serif_h)


def slab_top(s: Style, x0, x1, left=True, right=True) -> Path:
    return rect(x0 - (s.serif if left else 0), s.cap - s.serif_h, x1 + (s.serif if right else 0), s.cap)


def ring(s: Style, x0, y0, x1, y1, c=None, ci=None, **corners):
    """Contorno de uma forma fechada (O, bojos): externo e contraforma."""
    c = s.chamfer if c is None else c
    ci = s.chamfer_in if ci is None else ci
    inner = {k: (ci if v else 0) for k, v in corners.items()} if corners else {}
    outer_c = {k: (c if v else 0) for k, v in corners.items()} if corners else {}
    outer = octo(x0, y0, x1, y1, c, **outer_c)
    hole = octo(x0 + s.stem, y0 + s.bar, x1 - s.stem, y1 - s.bar, ci, **inner)
    return outer, hole


# ─── Maiúsculas ─────────────────────────────────────────────────────────────


def g_A(s):
    w = s.w(640)
    cap = s.cap
    leg = s.stem * 1.12
    apex = leg * 0.85
    cx = w / 2
    g = Glyph()
    g.add(poly([(0, 0), (leg, 0), (cx + apex / 2, cap), (cx - apex / 2, cap)]))
    g.add(poly([(w - leg, 0), (w, 0), (cx + apex / 2, cap), (cx - apex / 2, cap)]))
    yb = cap * 0.22
    outer_left = (cx - apex / 2) * (yb + s.bar * 0.9) / cap
    g.add(rect(outer_left + 20, yb, w - outer_left - 20, yb + s.bar * 0.9))
    g.add(rect(-s.serif * 0.7, 0, leg + s.serif * 0.5, s.serif_h))
    g.add(rect(w - leg - s.serif * 0.5, 0, w + s.serif * 0.7, s.serif_h))
    return g

def g_B(s):
    w = s.w(560)
    cap, m = s.cap, s.cap * 0.53
    g = Glyph()
    up_o, up_i = ring(s, 0, m - s.bar / 2, w - 22, cap, c=s.chamfer * 0.9, tl=0, tr=1, br=1, bl=0)
    lo_o, lo_i = ring(s, 0, 0, w, m + s.bar / 2, tl=0, tr=1, br=1, bl=0)
    g.add(up_o, lo_o).cut(up_i, lo_i)
    g.add(slab_top(s, 0, s.stem, right=False), slab_bottom(s, 0, s.stem, right=False))
    return g


def g_C(s):
    w = s.w(560)
    g = Glyph()
    outer, hole = ring(s, 0, 0, w, s.cap)
    g.add(outer).cut(hole)
    g.cut(rect(w - s.stem - 1, s.bar + s.spur, w + 1, s.cap - s.bar - s.spur))
    return g


def g_D(s):
    w = s.w(580)
    g = Glyph()
    outer, hole = ring(s, 0, 0, w, s.cap, c=s.chamfer * 1.2, tl=0, tr=1, br=1, bl=0)
    g.add(outer).cut(hole)
    g.add(slab_top(s, 0, s.stem, right=False), slab_bottom(s, 0, s.stem, right=False))
    return g


def _e_body(s, w, with_bottom=True):
    cap, m = s.cap, s.cap * 0.52
    g = Glyph()
    g.add(rect(0, 0, s.stem, cap))
    g.add(rect(0, cap - s.bar, w, cap), rect(w - s.bar * 0.85, cap - s.bar - s.spur * 0.75, w, cap))
    mid_end = w - s.w(70)
    g.add(rect(0, m - s.bar / 2, mid_end, m + s.bar / 2))
    g.add(slab_top(s, 0, s.stem, right=False))
    if with_bottom:
        g.add(rect(0, 0, w, s.bar), rect(w - s.bar * 0.85, 0, w, s.bar + s.spur * 0.75))
        g.add(slab_bottom(s, 0, s.stem, right=False))
    else:
        g.add(slab_bottom(s, 0, s.stem))
    return g


def g_E(s):
    return _e_body(s, s.w(500))


def g_F(s):
    return _e_body(s, s.w(480), with_bottom=False)


def g_G(s):
    w = s.w(580)
    cap = s.cap
    g = Glyph()
    outer, hole = ring(s, 0, 0, w, cap)
    g.add(outer).cut(hole)
    bar_top = cap * 0.5
    # lado direito aberto entre a ponta de cima e a barra
    g.cut(rect(w - s.stem - 1, bar_top, w + 1, cap - s.bar - s.spur))
    # barra entrando pela direita (termina reta, sem pontinha solta)
    g.add(rect(w * 0.5, bar_top - s.bar, w, bar_top))
    return g


def g_H(s):
    w = s.w(600)
    g = Glyph()
    g.add(rect(0, 0, s.stem, s.cap), rect(w - s.stem, 0, w, s.cap))
    m = s.cap * 0.52
    g.add(rect(s.stem, m - s.bar / 2, w - s.stem, m + s.bar / 2))
    for x in (0, w - s.stem):
        g.add(slab_top(s, x, x + s.stem), slab_bottom(s, x, x + s.stem))
    return g


def g_I(s):
    g = Glyph()
    g.add(rect(0, 0, s.stem, s.cap), slab_top(s, 0, s.stem), slab_bottom(s, 0, s.stem))
    return g


def g_J(s):
    w = s.w(500)
    cap = s.cap
    g = Glyph()
    outer, hole = ring(s, 0, 0, w, cap, c=s.chamfer, tl=0, tr=0, br=1, bl=1)
    g.add(outer).cut(hole)
    g.cut(rect(-1, cap * 0.36, s.stem + 1, cap + 1))  # tira a haste esquerda acima do gancho
    g.cut(rect(s.stem - 1, cap - s.bar - 1, w - s.stem + 1, cap + 1))  # sem barra no topo
    g.add(rect(w - s.stem - s.serif * 1.6, cap - s.serif_h, w + s.serif * 0.6, cap))
    return g


def g_K(s):
    w = s.w(600)
    cap = s.cap
    t = s.stem * 1.05
    g = Glyph()
    g.add(rect(0, 0, s.stem, cap))
    g.add(stroke(s.stem + t * 0.15, cap * 0.38, w - t / 2, cap, t))
    g.add(stroke(s.stem + t * 0.3, cap * 0.6, w - t / 2, 0, t))
    g.add(slab_top(s, 0, s.stem), slab_bottom(s, 0, s.stem))
    g.add(rect(w - t - s.serif * 0.4, cap - s.serif_h, w + s.serif * 0.6, cap))
    g.add(rect(w - t - s.serif * 0.4, 0, w + s.serif * 0.6, s.serif_h))
    return g


def g_L(s):
    w = s.w(480)
    g = Glyph()
    g.add(rect(0, 0, s.stem, s.cap), rect(0, 0, w, s.bar))
    g.add(rect(w - s.bar * 0.85, 0, w, s.bar + s.spur * 0.8))
    g.add(slab_top(s, 0, s.stem), slab_bottom(s, 0, s.stem, right=False))
    return g


def g_M(s):
    w = s.w(740)
    cap = s.cap
    st = s.stem * 0.95
    t = s.stem * 1.0
    cx = w / 2
    g = Glyph()
    g.add(rect(0, 0, st, cap), rect(w - st, 0, w, cap))
    g.add(poly([(0, cap), (st + t * 0.3, cap), (cx + t / 2, cap * 0.16), (cx - t / 2, cap * 0.16)]))
    g.add(poly([(w, cap), (w - st - t * 0.3, cap), (cx - t / 2, cap * 0.16), (cx + t / 2, cap * 0.16)]))
    g.add(rect(cx - t / 2, cap * 0.16 - 1, cx + t / 2, cap * 0.16 + 60))
    for x in (0, w - st):
        g.add(slab_bottom(s, x, x + st))
    g.add(slab_top(s, 0, st, right=False), slab_top(s, w - st, w, left=False))
    return g


def g_N(s):
    w = s.w(620)
    cap = s.cap
    st = s.stem * 0.9
    g = Glyph()
    g.add(rect(0, 0, st, cap), rect(w - st, 0, w, cap))
    g.add(poly([(0, cap), (st * 1.45, cap), (w, 0), (w - st * 1.45, 0)]))
    g.add(slab_top(s, 0, st), slab_bottom(s, 0, st), slab_top(s, w - st, w))
    return g


def g_O(s):
    w = s.w(600)
    g = Glyph()
    outer, hole = ring(s, 0, 0, w, s.cap)
    return g.add(outer).cut(hole)


def g_P(s):
    w = s.w(560)
    cap, m = s.cap, s.cap * 0.42
    g = Glyph()
    outer, hole = ring(s, 0, m - s.bar / 2, w, cap, tl=0, tr=1, br=1, bl=0)
    g.add(outer).cut(hole)
    g.add(rect(0, 0, s.stem, cap))
    g.add(slab_top(s, 0, s.stem, right=False), slab_bottom(s, 0, s.stem))
    return g


def g_Q(s):
    g = g_O(s)
    w = s.w(600)
    t = s.stem * 0.95
    g.add(poly([(w * 0.5, s.bar * 1.6), (w * 0.5 + t, s.bar * 1.6), (w + 40, -120), (w + 40 - t, -120)]))
    g.accent_x = w / 2
    return g


def g_R(s):
    g = g_P(s)
    w = s.w(580)
    cap, m = s.cap, s.cap * 0.42
    t = s.stem * 1.05
    g.add(stroke(w * 0.42, m, w - t / 2, 0, t))
    g.add(rect(w - t - s.serif * 0.3, 0, w + s.serif * 0.6, s.serif_h))
    return g


def g_S(s):
    # Montado peça por peça (não com dois anéis): espinha mais fina e pontas
    # curtas, para as aberturas não virarem frestas nos pesos mais grossos.
    w = s.w(560)
    cap, m = s.cap, s.cap * 0.52
    spine = s.bar * 0.85
    tip = min(s.spur, s.bar * 0.22)
    g = Glyph()
    g.add(rect(0, cap - s.bar, w - 12, cap))  # topo
    g.add(rect(0, m - spine / 2, s.stem, cap - s.bar))  # haste de cima, à esquerda
    g.add(rect(0, m - spine / 2, w, m + spine / 2))  # espinha
    g.add(rect(w - s.stem, s.bar, w, m + spine / 2))  # haste de baixo, à direita
    g.add(rect(0, 0, w, s.bar))  # base
    g.add(rect(w - 12 - s.stem, cap - s.bar - tip, w - 12, cap))  # ponta de cima
    g.add(rect(0, 0, s.stem, s.bar + tip))  # ponta de baixo
    c, ci = s.chamfer, s.chamfer_in
    if c:
        # cantos externos cortados — inclusive os do meio, onde a espinha
        # encontra as hastes (esq. embaixo e dir. em cima)
        for x, y, sx, sy, size in (
            (0, cap, 1, -1, c), (w - 12, cap, -1, -1, c),
            (0, 0, 1, 1, c), (w, 0, -1, 1, c),
            (0, m - spine / 2, 1, 1, c * 0.75), (w, m + spine / 2, -1, -1, c * 0.75),
        ):
            g.cut(poly([(x, y), (x + sx * size, y), (x, y + sy * size)]))
    if ci:
        # chanfro interno nas contraformas, como no O
        for x, y, sx, sy in (
            (s.stem, cap - s.bar, 1, -1), (s.stem, m + spine / 2, 1, 1),
            (w - s.stem, m - spine / 2, -1, -1), (w - s.stem, s.bar, -1, 1),
        ):
            g.add(poly([(x, y), (x + sx * ci, y), (x, y + sy * ci)]))
    return g


def g_T(s):
    w = s.w(560)
    cap = s.cap
    cx = w / 2
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap), rect(cx - s.stem / 2, 0, cx + s.stem / 2, cap))
    g.add(rect(0, cap - s.bar - s.spur, s.bar * 0.85, cap), rect(w - s.bar * 0.85, cap - s.bar - s.spur, w, cap))
    g.add(slab_bottom(s, cx - s.stem / 2, cx + s.stem / 2))
    return g


def g_U(s):
    w = s.w(600)
    cap = s.cap
    g = Glyph()
    g.add(octo(0, 0, w, cap, s.chamfer, tl=0, tr=0))
    g.cut(octo(s.stem, s.bar, w - s.stem, cap + 10, s.chamfer_in, tl=0, tr=0))
    g.add(slab_top(s, 0, s.stem), slab_top(s, w - s.stem, w))
    return g


def g_V(s):
    w = s.w(620)
    cap = s.cap
    t = s.stem * 1.12
    cx = w / 2
    g = Glyph()
    g.add(poly([(0, cap), (t, cap), (cx + t * 0.42, 0), (cx - t * 0.42, 0)]))
    g.add(poly([(w, cap), (w - t, cap), (cx - t * 0.42, 0), (cx + t * 0.42, 0)]))
    g.add(rect(-s.serif * 0.6, cap - s.serif_h, t + s.serif * 0.4, cap))
    g.add(rect(w - t - s.serif * 0.4, cap - s.serif_h, w + s.serif * 0.6, cap))
    return g


def g_W(s):
    w = s.w(860)
    cap = s.cap
    t = s.stem * 1.0
    q1, q3, cx = w * 0.27, w * 0.73, w / 2
    peak = cap * 0.78
    g = Glyph()
    g.add(poly([(0, cap), (t, cap), (q1 + t * 0.4, 0), (q1 - t * 0.4, 0)]))
    g.add(poly([(w, cap), (w - t, cap), (q3 - t * 0.4, 0), (q3 + t * 0.4, 0)]))
    g.add(poly([(q1 - t * 0.4, 0), (q1 + t * 0.4, 0), (cx + t * 0.4, peak), (cx - t * 0.4, peak)]))
    g.add(poly([(q3 + t * 0.4, 0), (q3 - t * 0.4, 0), (cx - t * 0.4, peak), (cx + t * 0.4, peak)]))
    g.add(rect(-s.serif * 0.6, cap - s.serif_h, t + s.serif * 0.4, cap))
    g.add(rect(w - t - s.serif * 0.4, cap - s.serif_h, w + s.serif * 0.6, cap))
    return g


def g_X(s):
    w = s.w(620)
    cap = s.cap
    t = s.stem * 1.08
    g = Glyph()
    g.add(stroke(t / 2, cap, w - t / 2, 0, t), stroke(w - t / 2, cap, t / 2, 0, t))
    for x0 in (0, w - t):
        g.add(rect(x0 - s.serif * 0.5, cap - s.serif_h, x0 + t + s.serif * 0.5, cap))
        g.add(rect(x0 - s.serif * 0.5, 0, x0 + t + s.serif * 0.5, s.serif_h))
    return g


def g_Y(s):
    w = s.w(620)
    cap = s.cap
    t = s.stem * 1.08
    cx = w / 2
    join = cap * 0.4
    g = Glyph()
    g.add(stroke(t / 2, cap, cx, join, t), stroke(w - t / 2, cap, cx, join, t))
    g.add(rect(cx - s.stem / 2, 0, cx + s.stem / 2, join + 20))
    g.add(slab_bottom(s, cx - s.stem / 2, cx + s.stem / 2))
    g.add(rect(-s.serif * 0.6, cap - s.serif_h, t + s.serif * 0.4, cap))
    g.add(rect(w - t - s.serif * 0.4, cap - s.serif_h, w + s.serif * 0.6, cap))
    return g


def g_Z(s):
    w = s.w(540)
    cap = s.cap
    t = s.stem * 1.15
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap), rect(0, 0, w, s.bar))
    g.add(poly([(w - t, cap - s.bar), (w, cap - s.bar), (t, s.bar), (0, s.bar)]))
    g.add(rect(0, cap - s.bar - s.spur * 0.8, s.bar * 0.85, cap))
    g.add(rect(w - s.bar * 0.85, 0, w, s.bar + s.spur * 0.8))
    return g


# ─── Algarismos (tabulares) ─────────────────────────────────────────────────


def _digit(s, g: Glyph):
    g.advance = s.digit_width
    return g


def dw(s):
    return s.digit_width - 2 * s.side - 20


def g_zero(s):
    w = dw(s)
    outer, hole = ring(s, 0, 0, w, s.cap)
    return _digit(s, Glyph().add(outer).cut(hole))


def g_one(s):
    w = dw(s)
    cx = w * 0.55
    g = Glyph()
    g.add(rect(cx - s.stem / 2, 0, cx + s.stem / 2, s.cap))
    # bandeira: paralelogramo descendo da quina superior esquerda da haste
    x = cx - s.stem / 2
    g.add(poly([(x + 20, s.cap), (x - 150, s.cap - 150), (x - 150, s.cap - 150 - s.bar * 0.95), (x + 20, s.cap - s.bar * 1.35)]))
    g.add(rect(cx - s.stem / 2 - s.serif * 2.2, 0, cx + s.stem / 2 + s.serif * 2.2, s.serif_h + 10))
    return _digit(s, g)


def _corner_cut(g, x, y, sx, sy, size):
    """Corta o canto convexo em (x, y); sx/sy apontam para dentro da letra."""
    g.cut(poly([(x, y), (x + sx * size, y), (x, y + sy * size)]))


def _corner_fill(g, x, y, sx, sy, size):
    """Chanfro interno no canto côncavo em (x, y); sx/sy apontam para a contraforma."""
    g.add(poly([(x, y), (x + sx * size, y), (x, y + sy * size)]))


def g_two(s):
    return _two_diagonal(s) if s.two == "diagonal" else _two_block(s)


def _two_block(s):
    # Construção de bloco, como S/3/5: topo, desce pela direita, barra do meio
    # para a esquerda, desce até a base. Sem diagonal.
    w = dw(s)
    cap, m = s.cap, s.cap * 0.5
    c, ci = s.chamfer, s.chamfer_in
    mid = s.bar * 0.9
    tip = min(s.spur, s.bar * 0.22)
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap))  # topo
    g.add(rect(0, cap - s.bar - tip, s.stem, cap))  # ponta esquerda
    g.add(rect(w - s.stem, m - mid / 2, w, cap))  # haste direita
    g.add(rect(0, m - mid / 2, w, m + mid / 2))  # barra do meio
    g.add(rect(0, s.bar, s.stem, m + mid / 2))  # haste esquerda
    g.add(rect(0, 0, w, s.bar), rect(w - s.bar * 0.85, 0, w, s.bar + s.spur * 0.7))  # base e esporão
    if c:
        _corner_cut(g, 0, cap, 1, -1, c)
        _corner_cut(g, w, cap, -1, -1, c)
        _corner_cut(g, w, m - mid / 2, -1, 1, c * 0.75)
        _corner_cut(g, 0, m + mid / 2, 1, -1, c * 0.75)
    if ci:
        _corner_fill(g, w - s.stem, cap - s.bar, -1, -1, ci)
        _corner_fill(g, w - s.stem, m + mid / 2, -1, 1, ci)
        _corner_fill(g, s.stem, m - mid / 2, 1, -1, ci)
        _corner_fill(g, s.stem, s.bar, 1, 1, ci)
    return _digit(s, g)


def _two_diagonal(s):
    # Bojo chanfrado em cima e diagonal até a base, com a diagonal da mesma
    # espessura visual das hastes (medida perpendicular, não na horizontal).
    w = dw(s)
    cap = s.cap
    c, ci = s.chamfer, s.chamfer_in
    tip = min(s.spur, s.bar * 0.22)
    y_turn = cap * 0.56
    dy = y_turn - s.bar
    t = s.stem
    for _ in range(3):
        t = s.stem * 0.78 * ((w - t / 2) ** 2 + dy ** 2) ** 0.5 / dy
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap))
    g.add(rect(0, cap - s.bar - tip, s.stem, cap))
    g.add(rect(w - s.stem, y_turn, w, cap))
    g.add(poly([(0, s.bar), (t, s.bar), (w, y_turn), (w - t, y_turn)]))
    g.add(rect(0, 0, w, s.bar), rect(w - s.bar * 0.85, 0, w, s.bar + s.spur * 0.7))
    if c:
        _corner_cut(g, 0, cap, 1, -1, c)
        _corner_cut(g, w, cap, -1, -1, c)
    if ci:
        _corner_fill(g, w - s.stem, cap - s.bar, -1, -1, ci)
    return _digit(s, g)

def g_three(s):
    # Montado peça por peça: lado direito reto (sem degrau entre os bojos) e
    # barra do meio terminando reta.
    w = dw(s)
    cap, m = s.cap, s.cap * 0.53
    c, ci = s.chamfer, s.chamfer_in
    tip = min(s.spur * 0.35, 30)
    mid_h = s.bar * 0.9
    mid_x0 = w * 0.3
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap), rect(0, 0, w, s.bar))  # topo e base
    g.add(rect(w - s.stem, 0, w, cap))  # lado direito
    g.add(rect(mid_x0, m - mid_h / 2, w, m + mid_h / 2))  # barra do meio
    g.add(rect(0, cap - s.bar - tip, s.stem, cap), rect(0, 0, s.stem, s.bar + tip))  # pontas
    if c:
        for x, y, sx, sy in ((0, cap, 1, -1), (w, cap, -1, -1), (0, 0, 1, 1), (w, 0, -1, 1)):
            g.cut(poly([(x, y), (x + sx * c, y), (x, y + sy * c)]))
        # entalhe no meio do lado direito, marcando os dois bojos
        n = c * 0.45
        g.cut(poly([(w + 1, m - n), (w - n, m), (w + 1, m + n)]))
    if ci:
        x = w - s.stem
        for y, sy in ((cap - s.bar, -1), (m + mid_h / 2, 1), (m - mid_h / 2, -1), (s.bar, 1)):
            g.add(poly([(x, y), (x - ci, y), (x, y + sy * ci)]))
    return _digit(s, g)


def g_four(s):
    w = dw(s)
    cap = s.cap
    sx = w - s.stem - 10
    bar_y = cap * 0.25
    t = s.stem * 1.1
    g = Glyph()
    g.add(rect(sx, 0, sx + s.stem, cap))
    g.add(stroke(sx + s.stem * 0.45, cap, t / 2, bar_y + s.bar, t))
    g.add(rect(0, bar_y, w, bar_y + s.bar))
    g.add(rect(sx - s.serif * 1.4, 0, sx + s.stem + s.serif * 1.4, s.serif_h))
    return _digit(s, g)


def g_five(s):
    w = dw(s)
    cap, m = s.cap, s.cap * 0.58
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap), rect(w - s.bar * 0.85, cap - s.bar - s.spur * 0.7, w, cap))
    g.add(rect(0, m - s.bar / 2, s.stem, cap))
    lo_o, lo_i = ring(s, 0, 0, w, m + s.bar / 2, tl=0, tr=1, br=1, bl=1)
    tip = min(s.spur, s.bar * 0.22)
    g.ops.append(("group", [("+", lo_o), ("-", lo_i), ("-", rect(-1, s.bar + tip, s.stem + 1, m - s.bar / 2))]))
    return _digit(s, g)


def _six_shapes(s, w):
    cap = s.cap
    outer, hole = ring(s, 0, 0, w, cap)
    bar_top = cap * 0.56
    ops = [
        ("+", outer), ("-", hole),
        ("-", rect(w - s.stem - 1, bar_top, w + 1, cap - s.bar - s.spur)),
        ("+", rect(s.stem - 1, bar_top - s.bar * 0.9, w - s.stem + 1, bar_top)),
    ]
    if s.chamfer:
        # canto do bojo onde a haste aberta termina (no 9, embaixo à esquerda)
        c = s.chamfer * 0.75
        ops.append(("-", poly([(w + 1, bar_top - c), (w - c, bar_top + 1), (w + 1, bar_top + 1)])))
    return ops


def g_six(s):
    w = dw(s)
    g = Glyph()
    g.ops.append(("group", _six_shapes(s, w)))
    return _digit(s, g)


def g_nine(s):
    w = dw(s)
    g = Glyph()
    g.ops.append(("group", _six_shapes(s, w)))
    g.ops.append(("rotate", (w / 2, s.cap / 2)))
    return _digit(s, g)


def g_seven(s):
    w = dw(s)
    cap = s.cap
    t = s.stem * 1.12
    g = Glyph()
    g.add(rect(0, cap - s.bar, w, cap), rect(0, cap - s.bar - s.spur * 0.8, s.bar * 0.85, cap))
    g.add(poly([(w - t, cap - s.bar), (w, cap - s.bar), (w * 0.42 + t / 2, 0), (w * 0.42 - t / 2, 0)]))
    return _digit(s, g)


def g_eight(s):
    w = dw(s)
    cap, m = s.cap, s.cap * 0.53
    up_o, up_i = ring(s, 14, m - s.bar / 2, w - 14, cap)
    lo_o, lo_i = ring(s, 0, 0, w, m + s.bar / 2)
    return _digit(s, Glyph().add(up_o, lo_o).cut(up_i, lo_i))


# ─── Pontuação e símbolos ───────────────────────────────────────────────────


def dot_size(s):
    return s.stem * 0.95


def g_period(s):
    d = dot_size(s)
    return Glyph().add(rect(0, 0, d, d))


def g_comma(s):
    d = dot_size(s)
    return Glyph().add(rect(0, 0, d, d), poly([(d * 0.25, 0), (d, 0), (d * 0.45, -d * 1.05), (-d * 0.1, -d * 1.05)]))


def g_colon(s):
    d = dot_size(s)
    return Glyph().add(rect(0, 0, d, d), rect(0, s.cap * 0.5 - d / 2 + 40, d, s.cap * 0.5 + d / 2 + 40))


def g_semicolon(s):
    d = dot_size(s)
    g = g_comma(s)
    return g.add(rect(0, s.cap * 0.5 - d / 2 + 40, d, s.cap * 0.5 + d / 2 + 40))


def g_exclam(s):
    d = dot_size(s)
    return Glyph().add(rect(0, 0, d, d), poly([(0, s.cap), (d, s.cap), (d * 0.82, d + 70), (d * 0.18, d + 70)]))


def g_question(s):
    w = s.w(480)
    cap = s.cap
    d = dot_size(s)
    cx = w * 0.5
    g = Glyph()
    outer, hole = ring(s, 0, cap * 0.38, w, cap, tl=1, tr=1, br=1, bl=0)
    g.ops.append(("group", [
        ("+", outer), ("-", hole),
        ("-", rect(-1, cap * 0.38 - 1, s.stem + 1, cap - s.bar - s.spur)),
        ("-", rect(-1, cap * 0.38 - 1, cx - s.stem * 0.45, cap * 0.38 + s.bar + 1)),
    ]))
    g.add(rect(cx - s.stem * 0.45, d + 70, cx + s.stem * 0.45, cap * 0.38 + s.bar))
    g.add(rect(cx - d / 2, 0, cx + d / 2, d))
    return g


def g_hyphen(s):
    return Glyph().add(rect(0, s.cap * 0.36, s.w(300), s.cap * 0.36 + s.bar))


def g_endash(s):
    return Glyph().add(rect(0, s.cap * 0.36, s.w(500), s.cap * 0.36 + s.bar))


def g_emdash(s):
    return Glyph().add(rect(0, s.cap * 0.36, s.w(900), s.cap * 0.36 + s.bar))


def g_quotesingle(s):
    return Glyph().add(poly([(0, s.cap), (s.stem * 0.8, s.cap), (s.stem * 0.62, s.cap - 240), (s.stem * 0.18, s.cap - 240)]))


def g_quotedbl(s):
    g = g_quotesingle(s)
    gap = s.stem * 0.8 + 50
    return g.add(poly([(gap, s.cap), (gap + s.stem * 0.8, s.cap), (gap + s.stem * 0.62, s.cap - 240), (gap + s.stem * 0.18, s.cap - 240)]))


def _quote_mark(s, x, up):
    d = dot_size(s) * 0.85
    y = s.cap - d
    if up:  # ’ — vírgula no alto
        return [rect(x, y, x + d, y + d), poly([(x + d * 0.25, y), (x + d, y), (x + d * 0.45, y - d * 0.9), (x - d * 0.1, y - d * 0.9)])]
    # ‘ — vírgula invertida
    y2 = s.cap - d * 1.9
    return [rect(x, y2, x + d, y2 + d), poly([(x + d * 0.75, y2 + d), (x, y2 + d), (x + d * 0.55, y2 + d * 1.9), (x + d * 1.1, y2 + d * 1.9)])]


def g_quoteright(s):
    return Glyph().add(*_quote_mark(s, 0, True))


def g_quoteleft(s):
    return Glyph().add(*_quote_mark(s, 0, False))


def g_quotedblright(s):
    gap = dot_size(s) * 0.85 + 40
    return Glyph().add(*_quote_mark(s, 0, True), *_quote_mark(s, gap, True))


def g_quotedblleft(s):
    gap = dot_size(s) * 0.85 + 40
    return Glyph().add(*_quote_mark(s, 0, False), *_quote_mark(s, gap, False))


def g_parenleft(s):
    t = s.stem * 0.85
    w = 250
    g = Glyph()
    g.add(octo(0, -110, w, s.cap + 110, 0, tl=150, bl=150))
    g.cut(octo(t, -110 + s.bar * 0.85, w + 10, s.cap + 110 - s.bar * 0.85, 0, tl=95, bl=95))
    return g


def g_parenright(s):
    t = s.stem * 0.85
    w = 250
    g = Glyph()
    g.add(octo(0, -110, w, s.cap + 110, 0, tr=150, br=150))
    g.cut(octo(-10, -110 + s.bar * 0.85, w - t, s.cap + 110 - s.bar * 0.85, 0, tr=95, br=95))
    return g


def g_slash(s):
    t = s.stem * 0.95
    return Glyph().add(stroke(t / 2, -60, 330 - t / 2, s.cap + 60, t))


def g_percent(s):
    w = s.w(720)
    cap = s.cap
    r = 240
    ring_t = s.stem * 0.6
    g = Glyph()
    for x0, y0 in ((0, cap - r * 1.25), (w - r, 0)):
        g.add(octo(x0, y0, x0 + r, y0 + r * 1.25, 60))
        g.cut(octo(x0 + ring_t, y0 + ring_t * 0.85, x0 + r - ring_t, y0 + r * 1.25 - ring_t * 0.85, 30))
    g.add(stroke(w * 0.2, 0, w * 0.8, cap, s.stem * 0.9))
    return g


def g_plus(s):
    w = s.w(520)
    cy = s.cap * 0.4
    t = s.bar
    return Glyph().add(rect(0, cy - t / 2, w, cy + t / 2), rect(w / 2 - t / 2, cy - w / 2 + 30, w / 2 + t / 2, cy + w / 2 - 30))


def g_equal(s):
    w = s.w(520)
    cy = s.cap * 0.4
    t = s.bar * 0.85
    return Glyph().add(rect(0, cy + 35, w, cy + 35 + t), rect(0, cy - 35 - t, w, cy - 35))


def g_numbersign(s):
    w = s.w(600)
    t = s.stem * 0.75
    g = Glyph()
    g.add(stroke(w * 0.36, 0, w * 0.44, s.cap, t), stroke(w * 0.62, 0, w * 0.7, s.cap, t))
    g.add(rect(0, s.cap * 0.27, w, s.cap * 0.27 + s.bar * 0.8), rect(0, s.cap * 0.6, w, s.cap * 0.6 + s.bar * 0.8))
    return g


def g_ampersand(s):
    w = s.w(640)
    cap = s.cap
    g = Glyph()
    up_o, up_i = ring(s, w * 0.08, cap * 0.52, w * 0.72, cap, c=70, ci=30)
    lo_o, lo_i = ring(s, 0, 0, w * 0.78, cap * 0.6, c=s.chamfer)
    g.ops.append(("group", [("+", up_o), ("-", up_i)]))
    g.ops.append(("group", [("+", lo_o), ("-", lo_i), ("-", rect(w * 0.78 - s.stem - 1, cap * 0.22, w * 0.78 + 1, cap * 0.6 + 1))]))
    g.add(stroke(w * 0.35, cap * 0.55, w - s.stem * 0.5, 0, s.stem * 1.05))
    g.add(rect(w * 0.62, cap * 0.3, w, cap * 0.3 + s.bar * 0.85))
    return g


def g_degree(s):
    r = 230
    t = s.stem * 0.55
    return Glyph().add(octo(0, s.cap - r, r, s.cap, 55)).cut(octo(t, s.cap - r + t, r - t, s.cap - t, 25))


def g_asterisk(s):
    cx, cy, t = 160, s.cap - 170, s.stem * 0.6
    g = Glyph()
    g.add(rect(cx - t / 2, cy - 160, cx + t / 2, cy + 160))
    g.add(stroke(cx - 130, cy - 90, cx + 130, cy + 90, t * 1.15))
    g.add(stroke(cx + 130, cy - 90, cx - 130, cy + 90, t * 1.15))
    return g


def g_underscore(s):
    return Glyph().add(rect(0, -140, s.w(520), -140 + s.bar * 0.8))


def g_at(s):
    w = s.w(760)
    cap = s.cap
    g = Glyph()
    outer, hole = ring(s, 0, -80, w, cap, c=150, ci=90)
    # contorno aberto embaixo à direita (o corte vai até a borda: sem ponta sobrando)
    g.ops.append(("group", [("+", outer), ("-", hole), ("-", rect(w * 0.6, -81, w + 1, cap * 0.1))]))
    inner = octo(w * 0.28, cap * 0.18, w * 0.7, cap * 0.68, 45)
    g.ops.append(("group", [("+", inner), ("-", octo(w * 0.28 + s.stem * 0.7, cap * 0.18 + s.bar * 0.8, w * 0.7 - s.stem * 0.7, cap * 0.68 - s.bar * 0.8, 20))]))
    g.add(rect(w * 0.7 - s.stem * 0.7, cap * 0.1, w * 0.7, cap * 0.68))
    g.add(rect(w * 0.7 - s.stem * 0.7, cap * 0.1, w * 0.86, cap * 0.1 + s.bar * 0.8))
    return g



# ─── Acentos (desenhados sobre a base) ──────────────────────────────────────

ACCENT_Y = 780  # base dos acentos sobre maiúsculas (cap 700 + folga)

# k: escala horizontal do acento (letras estreitas como I e E levam acento
# mais estreito, senão encostam no acento da letra vizinha)


def acc_acute(s, cx, k=1.0):
    t = s.stem * 0.8
    return [poly([(cx - 60 * k, ACCENT_Y), (cx - 60 * k + t, ACCENT_Y), (cx + 95 * k + t * 0.6, ACCENT_Y + 150), (cx + 95 * k - t * 0.4, ACCENT_Y + 150)])]


def acc_grave(s, cx, k=1.0):
    t = s.stem * 0.8
    return [poly([(cx + 60 * k, ACCENT_Y), (cx + 60 * k - t, ACCENT_Y), (cx - 95 * k - t * 0.6, ACCENT_Y + 150), (cx - 95 * k + t * 0.4, ACCENT_Y + 150)])]


def acc_circumflex(s, cx, k=1.0):
    t = s.stem * 0.75
    h = 150
    half = 170 * k
    return [
        poly([(cx - half, ACCENT_Y), (cx - half + t, ACCENT_Y), (cx + t * 0.45, ACCENT_Y + h), (cx - t * 0.45, ACCENT_Y + h)]),
        poly([(cx + half, ACCENT_Y), (cx + half - t, ACCENT_Y), (cx - t * 0.45, ACCENT_Y + h), (cx + t * 0.45, ACCENT_Y + h)]),
    ]


def acc_tilde(s, cx, k=1.0):
    t = s.bar * 0.8
    y = ACCENT_Y + 20
    a, b, c = 180 * k, 100 * k, 40 * k
    return [poly([
        (cx - a, y), (cx - a, y + t), (cx - b, y + t + 60), (cx + c, y + t), (cx + b, y + t + 45),
        (cx + a, y + t + 45), (cx + a, y + 45), (cx + b, y - 15), (cx - c, y + 45), (cx - b, y),
    ])]


def acc_dieresis(s, cx, k=1.0):
    d = dot_size(s) * 0.8
    gap = 25 * k
    return [rect(cx - gap - d, ACCENT_Y, cx - gap, ACCENT_Y + d), rect(cx + gap, ACCENT_Y, cx + gap + d, ACCENT_Y + d)]


def acc_cedilla(s, cx, k=1.0):
    t = s.bar * 0.8
    return [
        rect(cx - t / 2, -90, cx + t / 2, 10),
        poly([(cx - t / 2, -90), (cx + 110, -90), (cx + 110, -230), (cx - 130, -230), (cx - 130, -170), (cx + 30, -170), (cx + 30, -90 - 0.1)]),
    ]


ACCENTS = {
    "acute": acc_acute, "grave": acc_grave, "circumflex": acc_circumflex,
    "tilde": acc_tilde, "dieresis": acc_dieresis, "cedilla": acc_cedilla,
}

# letra acentuada -> (letra base, acento)
COMPOSITES = {
    "Á": ("A", "acute"), "À": ("A", "grave"), "Â": ("A", "circumflex"), "Ã": ("A", "tilde"), "Ä": ("A", "dieresis"),
    "É": ("E", "acute"), "È": ("E", "grave"), "Ê": ("E", "circumflex"), "Ë": ("E", "dieresis"),
    "Í": ("I", "acute"), "Ì": ("I", "grave"), "Î": ("I", "circumflex"), "Ï": ("I", "dieresis"),
    "Ó": ("O", "acute"), "Ò": ("O", "grave"), "Ô": ("O", "circumflex"), "Õ": ("O", "tilde"), "Ö": ("O", "dieresis"),
    "Ú": ("U", "acute"), "Ù": ("U", "grave"), "Û": ("U", "circumflex"), "Ü": ("U", "dieresis"),
    "Ç": ("C", "cedilla"), "Ñ": ("N", "tilde"),
}

BASE_GLYPHS = {
    **{chr(c): globals()[f"g_{chr(c)}"] for c in range(ord("A"), ord("Z") + 1)},
    "0": g_zero, "1": g_one, "2": g_two, "3": g_three, "4": g_four,
    "5": g_five, "6": g_six, "7": g_seven, "8": g_eight, "9": g_nine,
    ".": g_period, ",": g_comma, ":": g_colon, ";": g_semicolon, "!": g_exclam, "?": g_question,
    "-": g_hyphen, "–": g_endash, "—": g_emdash, "'": g_quotesingle, '"': g_quotedbl,
    "’": g_quoteright, "‘": g_quoteleft, "”": g_quotedblright, "“": g_quotedblleft,
    "(": g_parenleft, ")": g_parenright, "/": g_slash, "%": g_percent, "+": g_plus, "=": g_equal,
    "#": g_numbersign, "&": g_ampersand, "°": g_degree, "*": g_asterisk, "_": g_underscore, "@": g_at,
}

# glifos com espaçamento próprio (pontuação mais justa)
TIGHT = set(".,:;!'\"’‘”“")
