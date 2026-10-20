"""Gera a fonte Trainr Block (TTF) a partir de glyphs.py.

  python build.py [estilo ...] [--out DIR]

Sem estilo, gera o "classic" (o que vai para o app e o site) em dist/.
Para atualizar os apps: copie dist/TrainrBlock-Regular.ttf para
apps/mobile/assets/fonts/ e apps/web/public/fonts/. Requer
fonttools e skia-pathops (ver requirements.txt).
"""

import argparse
import dataclasses
import os
import unicodedata

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.areaPen import AreaPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from pathops import Path, PathOp, op

import glyphs as G

FAMILY = "Trainr Block"
VERSION = "1.000"

STYLES = {
    # Oficial (escolhida na rodada 3, opção M): proporções e larguras por letra
    # inspiradas na Backed, um pouco mais pesada.
    "classic": G.Style("classic", stem=156, bar=134, serif=42, serif_h=134, chamfer=96, chamfer_in=36, spur=112, side=24, digit_width=490, target_widths=G.LETTER_WIDTHS, target_scale=1.05),
    "classic-two-diagonal": None,  # preenchido abaixo: oficial com o 2 diagonal
    # Opções descartadas, mantidas para referência das rodadas de escolha
    "first-draft": G.Style("first-draft"),
    "condensed": G.Style("condensed", stem=140, bar=118, width=0.84, chamfer=85, chamfer_in=40, serif=28, side=30, digit_width=470),
    "heavy": G.Style("heavy", stem=176, bar=140, width=1.06, chamfer=118, chamfer_in=50, serif=40, serif_h=62, digit_width=560),
    # Rodada 2: serifas mais marcadas, cantos retos (pouco ou nenhum chanfro)
    "square": G.Style("square", bar=108, chamfer=0, chamfer_in=0, serif=62, serif_h=82, spur=110, side=40),
    "notch": G.Style("notch", bar=108, chamfer=32, chamfer_in=12, serif=62, serif_h=82, spur=110, side=40),
    "square-condensed": G.Style("square-condensed", stem=142, bar=104, width=0.86, chamfer=0, chamfer_in=0, serif=52, serif_h=78, spur=100, side=34, digit_width=480),
    "square-heavy": G.Style("square-heavy", stem=178, bar=120, width=1.04, chamfer=18, chamfer_in=0, serif=72, serif_h=92, spur=120, side=42, digit_width=570),
    # Rodada 3: proporções da Backed — condensada, chanfro grande por fora e
    # pequeno por dentro, serifas com a mesma espessura das barras
    "varsity": G.Style("varsity", stem=128, bar=112, serif=50, serif_h=112, chamfer=100, chamfer_in=38, spur=100, width=0.8, side=28, digit_width=450),
    "varsity-bold": G.Style("varsity-bold", stem=142, bar=122, serif=64, serif_h=122, chamfer=108, chamfer_in=40, spur=108, width=0.82, side=28, digit_width=470),
    "varsity-wide": G.Style("varsity-wide", stem=132, bar=114, serif=54, serif_h=114, chamfer=104, chamfer_in=38, spur=102, width=0.92, side=30, digit_width=490),
    # Rodada 3b: espessuras e larguras por letra nas proporções da Backed
    "block": G.Style("block", stem=140, bar=122, serif=35, serif_h=122, chamfer=88, chamfer_in=35, spur=106, side=24, digit_width=470, target_widths=G.LETTER_WIDTHS),
    "block-serif": G.Style("block-serif", stem=140, bar=122, serif=52, serif_h=122, chamfer=88, chamfer_in=35, spur=106, side=26, digit_width=480, target_widths=G.LETTER_WIDTHS, target_scale=1.04),
    "block-bold": G.Style("block-bold", stem=156, bar=134, serif=42, serif_h=134, chamfer=96, chamfer_in=36, spur=112, side=24, digit_width=490, target_widths=G.LETTER_WIDTHS, target_scale=1.05),
}

STYLES["classic-two-diagonal"] = dataclasses.replace(STYLES["classic"], name="classic-two-diagonal", two="diagonal")

# pares de kerning básicos (em unidades da fonte, antes do multiplicador de largura)
KERNING = [
    ("A", "V", -70), ("A", "W", -50), ("A", "Y", -70), ("A", "T", -60),
    ("V", "A", -70), ("W", "A", -50), ("Y", "A", -70), ("T", "A", -60),
    ("L", "T", -70), ("L", "V", -60), ("L", "Y", -70), ("L", "W", -40),
    ("P", "A", -45), ("F", "A", -40), ("T", "O", -20), ("O", "T", -20),
    ("T", "period", -80), ("T", "comma", -80), ("V", "period", -70), ("V", "comma", -70),
    ("Y", "period", -70), ("Y", "comma", -70), ("P", "period", -70), ("P", "comma", -70),
    ("F", "period", -60), ("F", "comma", -60), ("A", "quoteright", -60), ("L", "quoteright", -70),
]


def evaluate(ops) -> Path:
    current = Path()
    for kind, value in ops:
        if kind == "+":
            current = op(current, value, PathOp.UNION)
        elif kind == "-":
            current = op(current, value, PathOp.DIFFERENCE)
        elif kind == "&":  # recorta pelo contorno dado (cantos chanfrados)
            current = op(current, value, PathOp.INTERSECTION)
        elif kind == "group":
            current = op(current, evaluate(value), PathOp.UNION)
        elif kind == "rotate":  # 180° em torno de (cx, cy): o 9 é o 6 girado
            cx, cy = value
            rotated = Path()
            current.draw(TransformPen(rotated.getPen(), (-1, 0, 0, -1, 2 * cx, 2 * cy)))
            current = rotated
        else:
            raise ValueError(kind)
    return current


def translated(path: Path, dx: float) -> Path:
    moved = Path()
    path.draw(TransformPen(moved.getPen(), (1, 0, 0, 1, dx, 0)))
    return moved


def glyph_name(char: str) -> str:
    names = {
        ".": "period", ",": "comma", ":": "colon", ";": "semicolon", "!": "exclam", "?": "question",
        "-": "hyphen", "–": "endash", "—": "emdash", "'": "quotesingle", '"': "quotedbl",
        "’": "quoteright", "‘": "quoteleft", "”": "quotedblright", "“": "quotedblleft",
        "(": "parenleft", ")": "parenright", "/": "slash", "%": "percent", "+": "plus", "=": "equal",
        "#": "numbersign", "&": "ampersand", "°": "degree", "*": "asterisk", "_": "underscore", "@": "at",
        "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
        "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
    }
    if char in names:
        return names[char]
    if char.isascii():
        return char
    return unicodedata.name(char).replace("LATIN CAPITAL LETTER ", "").replace(" WITH ", "").title().replace(" ", "")


def to_tt_glyph(path: Path):
    area = AreaPen()
    path.draw(area)
    pen = TTGlyphPen(None)
    # TrueType quer contornos externos no sentido horário (área negativa)
    path.draw(ReverseContourPen(pen) if area.value > 0 else pen)
    return pen.glyph()


def shape_width(fn, style: G.Style) -> float:
    x_min, _, x_max, _ = evaluate(fn(style).ops).bounds
    return x_max - x_min


def style_for(char: str, style: G.Style) -> G.Style:
    """Estilo com o multiplicador de largura que faz a letra bater a largura-alvo.

    A largura da forma cresce linearmente com `width` (hastes e serifas não
    escalam), então duas medições bastam para achar o multiplicador.
    """
    targets = dict(style.target_widths or ())
    if char not in targets:
        return style
    fn = G.BASE_GLYPHS[char]
    target = targets[char] * style.target_scale
    w1 = shape_width(fn, dataclasses.replace(style, width=1.0))
    w2 = shape_width(fn, dataclasses.replace(style, width=0.5))
    slope = (w1 - w2) / 0.5
    if abs(slope) < 1e-6:
        return style
    return dataclasses.replace(style, width=max(0.3, 1.0 + (target - w1) / slope))


def build(style: G.Style, out_dir: str) -> str:
    shapes: dict[str, tuple[Path, float | None, float]] = {}

    def place(char, path, advance=None):
        x_min, _, x_max, _ = path.bounds
        side = style.side * (0.6 if char in G.TIGHT else 1)
        width = x_max - x_min
        if advance is None:
            advance = width + 2 * side
            dx = side - x_min
        else:
            dx = (advance - width) / 2 - x_min
        shapes[char] = (translated(path, dx), advance)

    for char, fn in G.BASE_GLYPHS.items():
        g = fn(style_for(char, style))
        place(char, evaluate(g.ops), g.advance)

    for char, (base, accent) in G.COMPOSITES.items():
        g = G.BASE_GLYPHS[base](style_for(base, style))
        base_path = evaluate(g.ops)
        x_min, _, x_max, _ = base_path.bounds
        cx = g.accent_x if g.accent_x is not None else (x_min + x_max) / 2
        if base == "I":
            cx = style.stem / 2
        # acento proporcional à letra (o "O" de referência tem ~430 de largura)
        k = max(0.55, min(1.0, (x_max - x_min) / 430))
        combined = op(base_path, evaluate([("+", p) for p in G.ACCENTS[accent](style, cx, k)]), PathOp.UNION)
        place(char, combined, g.advance)

    order = [".notdef", "space"]
    glyf = {}
    metrics = {}

    notdef = Path()
    for p in (G.rect(50, 0, 450, style.cap),):
        notdef = op(notdef, p, PathOp.UNION)
    notdef = op(notdef, G.rect(110, 60, 390, style.cap - 60), PathOp.DIFFERENCE)
    glyf[".notdef"] = to_tt_glyph(notdef)
    metrics[".notdef"] = (500, 50)
    glyf["space"] = TTGlyphPen(None).glyph()
    metrics["space"] = (round(style.w(250)), 0)

    cmap = {0x20: "space", 0xA0: "space"}
    for char, (path, advance) in shapes.items():
        name = glyph_name(char)
        order.append(name)
        tt = to_tt_glyph(path)
        tt.recalcBounds(None)
        glyf[name] = tt
        metrics[name] = (round(advance), getattr(tt, "xMin", 0))
        cmap[ord(char)] = name
        # fonte de títulos (sempre em caixa alta): minúscula usa o mesmo glifo
        lower = char.lower()
        if lower != char and len(lower) == 1:
            cmap[ord(lower)] = name
    cmap[ord("x")] = "X"  # "3x", "12x" nas séries

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyf)
    fb.setupHorizontalMetrics(metrics)
    ascent, descent = 950, -270
    fb.setupHorizontalHeader(ascent=ascent, descent=descent)
    suffix = "" if style.name == "classic" else f" {style.name.title()}"
    family = FAMILY + suffix
    ps_name = family.replace(" ", "") + "-Regular"
    fb.setupNameTable({
        "copyright": "Copyright (c) 2026 Personal Trainr. Todos os direitos reservados.",
        "familyName": family,
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{ps_name};{VERSION}",
        "fullName": f"{family} Regular",
        "version": f"Version {VERSION}",
        "psName": ps_name,
        "manufacturer": "Personal Trainr",
        "description": "Fonte de títulos e números do Personal Trainr.",
    })
    fb.setupOS2(
        sTypoAscender=ascent, sTypoDescender=descent, sTypoLineGap=0,
        usWinAscent=ascent, usWinDescent=-descent,
        sCapHeight=round(style.cap), sxHeight=round(style.cap),
        achVendID="PTRN", fsType=0, usWeightClass=700,
    )
    fb.setupPost()

    known = set(order)
    pairs = [(a if len(a) > 1 else a, b if len(b) > 1 else b, v) for a, b, v in KERNING]
    lines = [f"pos {a} {b} {round(v * style.width)};" for a, b, v in pairs if a in known and b in known]
    fb.addOpenTypeFeatures("languagesystem DFLT dflt;\nlanguagesystem latn dflt;\nfeature kern {\n  " + "\n  ".join(lines) + "\n} kern;\n")

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{ps_name}.ttf")
    fb.save(path)
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("styles", nargs="*", default=["classic"])
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "dist"))
    args = parser.parse_args()
    for name in args.styles:
        print(build(STYLES[name], args.out))


if __name__ == "__main__":
    main()
