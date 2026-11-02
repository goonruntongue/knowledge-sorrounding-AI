"""Normalize the checked delivery sprites and package them as a looping GIF.

The source PNGs are intentionally preserved.  Each frame is placed on a larger
transparent canvas so that the complete mailbox and plane keep a safe margin.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).parent
FRAMES = ROOT / "frames"
SOURCES = FRAMES / "sources"
SIZE = (1536, 1536)
# The last illustration is naturally composed further left.  This aligns its
# mailbox with the delivery frames without cropping a single source pixel.
OFFSETS = [
    (141, 141),
    (141, 141),
    (141, 141),
    (141, 141),
    (141, 141),
    (141, 141),
    (141, 141),
    (141, 141),
    (361, 141),
]
DURATIONS = [260, 260, 260, 260, 260, 260, 260, 260, 700]


def normalized_frame(path: Path, offset: tuple[int, int]) -> Image.Image:
    source = Image.open(path).convert("RGBA")
    canvas = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(source, offset)
    return canvas


def gif_frame(frame: Image.Image) -> Image.Image:
    """Reserve palette index 255 for true transparency in the GIF."""
    transparent_index = 255
    rgb = frame.convert("RGB")
    palette_frame = rgb.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    pixels = list(palette_frame.getdata())
    alpha = list(frame.getchannel("A").getdata())
    pixels = [transparent_index if value < 128 else pixel for pixel, value in zip(pixels, alpha)]
    converted = Image.new("P", frame.size)
    converted.putpalette(palette_frame.getpalette())
    converted.putdata(pixels)
    converted.info["transparency"] = transparent_index
    return converted


def main() -> None:
    sources = sorted(SOURCES.glob("delivery-??.png"))
    if len(sources) != len(OFFSETS):
        raise SystemExit("Expected nine checked source frames.")

    frames = [normalized_frame(path, offset) for path, offset in zip(sources, OFFSETS)]
    for number, frame in enumerate(frames, start=1):
        frame.save(FRAMES / f"delivery-{number:02}.png")

    gif_frames = [gif_frame(frame) for frame in frames]

    gif_frames[0].save(
        ROOT / "fortune-delivery.gif",
        save_all=True,
        append_images=gif_frames[1:],
        duration=DURATIONS,
        loop=0,
        disposal=2,
        transparency=255,
        optimize=False,
    )


if __name__ == "__main__":
    main()
