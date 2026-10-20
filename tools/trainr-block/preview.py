"""Renderiza amostras da fonte em PNG para revisão: python preview.py FONTE.ttf SAIDA.png [linhas...]"""
import sys

from PIL import Image, ImageDraw, ImageFont

BG, FG, GOLD = (51, 51, 51), (217, 217, 217), (175, 145, 80)
DEFAULT = [
    "ABCDEFGHIJKLM",
    "NOPQRSTUVWXYZ",
    "0123456789 %+=#",
    "ÁÀÂÃÉÊÍÓÔÕÚÇ Ñ",
    ".,:;!? -–— '\"‘’“” () / & ° * @",
]


def render(font_path, out, lines, size=88):
    font = ImageFont.truetype(font_path, size)
    pad, gap = 30, int(size * 1.35)
    width = max(int(font.getlength(l)) for l in lines) + pad * 2
    im = Image.new("RGB", (width, pad * 2 + gap * len(lines)), BG)
    d = ImageDraw.Draw(im)
    for i, line in enumerate(lines):
        y = pad + i * gap + int(size * 0.2)
        d.text((pad, y), line, font=font, fill=GOLD if i % 2 else FG)
    im.save(out)


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2], sys.argv[3:] or DEFAULT)
