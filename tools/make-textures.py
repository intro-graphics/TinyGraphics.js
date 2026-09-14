"""Regenerate the palette textures in assets/ (standard library only).

    python3 tools/make-textures.py

assets/grid.png       a 4x4 grid of ink lines with a few filled cells; asymmetric, so flips and
                      stretches in a texture mapping are easy to see.
assets/primaries.png  red | yellow | blue stripes (x, y, z) for Axis_Arrows' texture ranges.
Colours match defs.palette in common.js.
"""
import struct
import zlib
from pathlib import Path

PAPER, INK = (247, 245, 240), (22, 22, 26)
RED, YELLOW, BLUE = (224, 53, 31), (242, 178, 0), (31, 78, 163)
SIZE = 512
ASSETS = Path(__file__).resolve().parent.parent / "assets"


def write_png(path, pixel):
    rows = b"".join(b"\0" + bytes(c for x in range(SIZE) for c in pixel(x, y)) for y in range(SIZE))
    chunk = lambda kind, data: struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0)) \
        + chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def grid(x, y, cell=SIZE // 4, line=10):
    # Lines sit on the cell borders, half on each side, so the texture tiles seamlessly.
    if (x + line // 2) % cell < line or (y + line // 2) % cell < line:
        return INK
    filled = {(0, 0): RED, (3, 1): BLUE, (1, 2): YELLOW, (2, 3): INK, (3, 3): RED}
    return filled.get((x // cell, y // cell), PAPER)


def primaries(x, y, line=8):
    third = SIZE / 3
    if min(abs(x - third), abs(x - 2 * third)) < line / 2:
        return INK
    return (RED, YELLOW, BLUE)[min(int(x / third), 2)]


write_png(ASSETS / "grid.png", grid)
write_png(ASSETS / "primaries.png", primaries)
print("wrote assets/grid.png, assets/primaries.png")
