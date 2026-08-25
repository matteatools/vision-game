from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "assets" / "home"
OG = ROOT / "assets" / "og"


def cover(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    source_ratio = image.width / image.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        width = round(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    else:
        height = round(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    return image.resize(size, Image.Resampling.LANCZOS)


def add_logo(canvas: Image.Image, path: Path, width_fraction: float, x_fraction: float, y_fraction: float) -> None:
    logo = Image.open(path).convert("RGBA")
    width = round(canvas.width * width_fraction)
    height = round(logo.height * width / logo.width)
    logo = logo.resize((width, height), Image.Resampling.LANCZOS)
    x = round((canvas.width - width) * x_fraction)
    y = round(canvas.height * y_fraction)
    canvas.alpha_composite(logo, (x, y))


def save_webp(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "WEBP", quality=82, method=6)


def save_jpeg(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "JPEG", quality=88, optimize=True, progressive=True)


def make_title(background: Path, logo: Path, home_name: str, og_name: str, width: float, x: float, y: float) -> None:
    home = cover(background, (960, 600))
    add_logo(home, logo, width, x, y)
    save_webp(home, HOME / home_name)

    social = cover(background, (1200, 630))
    add_logo(social, logo, width, x, y)
    save_jpeg(social, OG / og_name)


def main() -> None:
    make_title(
        ROOT / "games" / "kemono-karate" / "assets" / "title-landscape-v2.webp",
        ROOT / "games" / "kemono-karate" / "assets" / "logo-kemono-karate-isshu-nyukon-v1.webp",
        "title-kemono-karate.webp",
        "kemono-karate.jpg",
        0.54,
        0.5,
        0.03,
    )
    save_webp(
        cover(ROOT / "games" / "kemono-karate" / "assets" / "dojo-landscape-v2.webp", (960, 600)),
        HOME / "play-kemono-karate.webp",
    )

    make_title(
        ROOT / "games" / "world-zoo" / "assets" / "ui" / "title-world-zoo-v3.webp",
        ROOT / "games" / "world-zoo" / "assets" / "ui" / "title-logo-illustrated-v2.webp",
        "title-world-zoo.webp",
        "world-zoo.jpg",
        0.53,
        0.5,
        0.035,
    )
    save_webp(
        cover(ROOT / "games" / "world-zoo" / "assets" / "scenes" / "area-forest-animals-v1.webp", (960, 600)),
        HOME / "play-world-zoo.webp",
    )

    make_title(
        ROOT / "games" / "warikiri-code" / "assets" / "title-bg-landscape.png",
        ROOT / "games" / "warikiri-code" / "assets" / "title-logo-sharp-condensed.png",
        "title-warikiri-code.webp",
        "warikiri-code.jpg",
        0.49,
        0.95,
        0.04,
    )
    save_webp(
        cover(ROOT / "games" / "warikiri-code" / "assets" / "title-bg-landscape.png", (960, 600)),
        HOME / "play-warikiri-code.webp",
    )

    make_title(
        ROOT / "games" / "mentaru-shindan" / "characters" / "all-characters-top.webp",
        ROOT / "games" / "mentaru-shindan" / "brand" / "mentaru-shindan-logo.webp",
        "title-mentaru-shindan.webp",
        "mentaru-shindan.jpg",
        0.43,
        0.5,
        0.035,
    )
    save_webp(
        cover(ROOT / "games" / "mentaru-shindan" / "og.png", (960, 600)),
        HOME / "play-mentaru-shindan.webp",
    )


if __name__ == "__main__":
    main()
