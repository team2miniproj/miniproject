
from PIL import Image, ImageDraw, ImageFont
import textwrap
from services.translator import translate_text_to_korean

def add_text_boxes_to_combined_image(
    img: Image.Image,
    scenes: list,
    font_path: str = None,
    *,
    base_font_size: int = 28,
    min_font_size: int = 14,
    box_height_ratio: float = 0.22,
    padding: int = 20,
    text_color: str = "black",
    background_color: str = "white",
    max_chars_per_line: int = 20,
    max_lines: int = 5
) -> Image.Image:
    draw = ImageDraw.Draw(img)
    panel_width = img.width // 2
    panel_height = img.height // 2
    box_height = int(panel_height * box_height_ratio)

    positions = [
        (0, 0), (panel_width, 0),
        (0, panel_height), (panel_width, panel_height)
    ]

    for idx, (x, y) in enumerate(positions):
        original_dialogue = scenes[idx]['dialogue']
        translated = translate_text_to_korean(original_dialogue)

        font_size = base_font_size
        while font_size >= min_font_size:
            font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
            wrapped = textwrap.fill(translated, width=max_chars_per_line)
            lines = wrapped.split('\n')

            total_text_height = len(lines) * (font_size + 6) + padding * 2
            if total_text_height <= box_height:
                break
            font_size -= 2

        if font_size < min_font_size:
            font_size = min_font_size
            font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
            wrapped = textwrap.fill(translated, width=max_chars_per_line)
            lines = wrapped.split('\n')
            if len(lines) > max_lines:
                lines = lines[:max_lines]
                lines[-1] = lines[-1].rstrip() + "..."

        text_y = y + panel_height - box_height + padding

        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            text_bg_x0 = x + padding
            text_bg_y0 = text_y
            text_bg_x1 = text_bg_x0 + text_width + 10 
            text_bg_y1 = text_bg_y0 + text_height + 4

            draw.rectangle(
                [text_bg_x0, text_bg_y0, text_bg_x1, text_bg_y1],
                fill=background_color
            )
            draw.text((text_bg_x0 + 2, text_bg_y0), line, fill=text_color, font=font)
            text_y += font_size + 6

    return img
