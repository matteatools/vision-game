from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


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


def contain_over_blur(path: Path, size: tuple[int, int]) -> Image.Image:
    """Keep the whole captured screen visible while filling non-matching ratios."""
    source = Image.open(path).convert("RGB")
    background = cover(path, size).convert("RGB")
    background = background.filter(ImageFilter.GaussianBlur(max(size) * 0.025))
    foreground = ImageOps.contain(source, size, Image.Resampling.LANCZOS)
    left = (size[0] - foreground.width) // 2
    top = (size[1] - foreground.height) // 2
    background.paste(foreground, (left, top))
    return background


def make_title(background: Path, logo: Path, home_name: str, og_name: str, width: float, x: float, y: float) -> None:
    home = cover(background, (960, 600))
    add_logo(home, logo, width, x, y)
    save_webp(home, HOME / home_name)

    social = cover(background, (1200, 630))
    add_logo(social, logo, width, x, y)
    save_jpeg(social, OG / og_name)


def make_complete_title(screen: Path) -> None:
    title = contain_over_blur(screen, (960, 600))
    play = contain_over_blur(screen, (960, 600))
    social = contain_over_blur(screen, (1200, 630))
    save_webp(title, HOME / "title-mentaru-shindan.webp")
    save_webp(play, HOME / "play-mentaru-shindan.webp")
    save_jpeg(social, OG / "mentaru-shindan.jpg")


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

    make_title(
        ROOT / "games" / "world-zoo" / "assets" / "ui" / "title-world-zoo-v3.webp",
        ROOT / "games" / "world-zoo" / "assets" / "ui" / "title-logo-illustrated-v2.webp",
        "title-world-zoo.webp",
        "world-zoo.jpg",
        0.53,
        0.5,
        0.035,
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

    make_complete_title(
        ROOT / "games" / "mentaru-shindan" / "previews" / "title-screen-current.png"
    )

    # The other three play images are browser-captured gameplay screens. Keep
    # them checked in instead of rebuilding them from title illustrations.


if __name__ == "__main__":
    main()
