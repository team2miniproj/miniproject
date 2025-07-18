import os
from PIL import Image, ImageDraw, ImageFont
import requests
import io
import uuid
import textwrap
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv
import asyncio

load_dotenv()

# httpx 클라이언트 설정
http_client = httpx.AsyncClient()
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    http_client=http_client
)

class ComicGenerator:
    def __init__(self):
        self.CHARACTER_STYLES = {
            "male": {
                "default": "A calm Korean man in his late 20s with short black hair and glasses, wearing a hoodie.",
            },
            "female": {
                "default": "A kind-looking Korean woman in her 20s with straight black hair, wearing casual indoor clothes.",
            }
        }

    async def get_script(self, text: str, gender: str) -> list:
        character_style = self.CHARACTER_STYLES[gender]["default"]
        prompt = f"""
You are a Japanese comic writer INOUE TAKEHIKO. 
Do not use speech bubbles.
First, translate the diary entry to fluent English if it's not already in English.
Then, generate a 4-panel wholesome slice-of-life comic scenario with a character described as: {character_style}

Each panel must include a 'Scene' and a 'Dialogue' in the following format:

[Panel 1]
Scene: ...
Dialogue: ...

[Panel 2]
...

Diary: {text}
"""

        res = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        text = res.choices[0].message.content.strip()

        scenes = []
        for i in range(1, 5):
            start_token = f"[Panel {i}]"
            end_token = f"[Panel {i+1}]" if i < 4 else None

            if start_token not in text:
                raise ValueError(f"{start_token} not found in GPT output.")

            part = text.split(start_token)[1]
            if end_token and end_token in part:
                part = part.split(end_token)[0]

            lines = part.strip().splitlines()
            scene = {"scene": "", "dialogue": ""}
            for line in lines:
                if line.lower().startswith("scene:"):
                    scene["scene"] = line.split(":", 1)[-1].strip()
                elif line.lower().startswith("dialogue:"):
                    scene["dialogue"] = line.split(":", 1)[-1].strip()
            scenes.append(scene)
        
        return scenes

    async def translate_text_to_korean(self, text: str) -> str:
        res = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": f"Translate this into comics style natural Korean:\n{text}"}
            ],
            temperature=0.5,
        )
        return res.choices[0].message.content.strip()

    async def build_combined_prompt(self, scenes: list, gender: str) -> str:
        character_desc = self.CHARACTER_STYLES[gender]["default"]
        prompt = (
            f"{character_desc} "
            "Create a 4-panel wholesome slice-of-life comic. Each panel is described below:\n"
        )
        for i, scene in enumerate(scenes, 1):
            prompt += f"[Panel {i}] Scene: {scene['scene']}. Dialogue: {scene['dialogue']}\n"
        prompt += (
            "Draw all 4 panels in a single 1024x1024 image, arranged in 2x2 layout. "
            "Do not include any text for image generation. Asian style art, and consistent Korean characters. "
            "Avoid violence, sensitive topics, or anything that violates content policies."
        )
        return prompt

    async def generate_combined_image(self, prompt: str, max_retries: int = 5) -> Image.Image:
        for attempt in range(1, max_retries + 1):
            try:
                print(f"🖼️ 이미지 생성 시도 {attempt}/{max_retries}")
                print(f"📝 프롬프트: {prompt[:100]}...")
                
                # 프롬프트 검증 및 정리
                cleaned_prompt = self._clean_prompt(prompt)
                
                response = await client.images.generate(
                    model="dall-e-3",
                    prompt=cleaned_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                    response_format="url",
                    style="natural"
                )
                
                if not response.data or len(response.data) == 0:
                    raise RuntimeError("OpenAI API에서 이미지 데이터를 받지 못했습니다.")
                
                image_url = response.data[0].url
                print(f"✅ 이미지 URL 생성 성공: {image_url[:50]}...")
                
                # 이미지 다운로드 (더 긴 타임아웃)
                async with httpx.AsyncClient(timeout=600) as http_client:
                    response = await http_client.get(image_url)
                    if response.status_code != 200:
                        raise RuntimeError(f"이미지 다운로드 실패: {response.status_code}")
                    image_data = response.content
                
                print(f"✅ 이미지 다운로드 완료: {len(image_data)} bytes")
                return Image.open(io.BytesIO(image_data))
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ 이미지 생성 시도 {attempt} 실패: {error_msg}")
                
                # 특정 에러에 대한 처리
                if "rate_limit" in error_msg.lower() or "quota" in error_msg.lower():
                    wait_time = attempt * 10  # Rate limit 시 더 오래 대기
                    print(f"⏳ Rate limit 감지. {wait_time}초 대기...")
                    await asyncio.sleep(wait_time)
                elif "content_policy" in error_msg.lower():
                    print("🚫 콘텐츠 정책 위반. 프롬프트 수정 필요")
                    # 프롬프트를 더 안전하게 수정
                    prompt = self._make_safe_prompt(prompt)
                    continue
                else:
                    wait_time = attempt * 2  # 일반적인 에러는 짧게 대기
                    print(f"🔄 {wait_time}초 후 재시도...")
                    await asyncio.sleep(wait_time)
                
                if attempt == max_retries:
                    raise RuntimeError(f"Image generation failed after {max_retries} attempts: {error_msg}")
                continue

    def _clean_prompt(self, prompt: str) -> str:
        """프롬프트를 정리하고 안전하게 만듭니다."""
        # 부적절한 단어 필터링
        inappropriate_words = ["violence", "blood", "weapon", "nude", "sexual"]
        for word in inappropriate_words:
            if word in prompt.lower():
                prompt = prompt.replace(word, "safe")
        
        # 프롬프트 길이 제한
        if len(prompt) > 1000:
            prompt = prompt[:1000] + "..."
        
        return prompt

    def _make_safe_prompt(self, prompt: str) -> str:
        """프롬프트를 더 안전하게 만듭니다."""
        safe_prompt = "A wholesome, family-friendly 4-panel comic strip with Korean characters. " + prompt
        return self._clean_prompt(safe_prompt)

    async def add_text_boxes_to_combined_image(
        self,
        img: Image.Image,
        scenes: list,
        font_path: str = None,
        *,
        base_font_size: int = 40,  # 폰트 크기 상향
        min_font_size: int = 24,
        box_height_ratio: float = 0.22,
        padding: int = 20,
        text_color: str = "black",
        box_fill: str = "white",
        box_outline: str = "white",
        max_chars_per_line: int = 18,  # 한 줄 최대 글자 수 약간 줄임
        max_lines: int = 2  # 2줄로 제한
    ) -> Image.Image:
        draw = ImageDraw.Draw(img)
        panel_width = img.width // 2
        panel_height = img.height // 2
        box_height = int(panel_height * box_height_ratio)

        # Danjo-bold-Regular.otf 폰트 경로 (backendC 폴더 기준)
       
        font_path = os.path.join(os.path.dirname(__file__), '../Danjo-bold-Regular.otf')

        positions = [
            (0, 0), (panel_width, 0),
            (0, panel_height), (panel_width, panel_height)
        ]

        for idx, (x, y) in enumerate(positions):
            original_dialogue = scenes[idx]['dialogue']
            translated = await self.translate_text_to_korean(original_dialogue)

            font_size = base_font_size
            lines = []
            while font_size >= min_font_size:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                except Exception:
                    font = ImageFont.load_default()
                # 줄바꿈: 2줄 이내로 맞추기
                wrapped = textwrap.wrap(translated, width=max_chars_per_line)
                if len(wrapped) > max_lines:
                    wrapped = wrapped[:max_lines]
                    # 마지막 줄 끝에 ... 붙이기
                    wrapped[-1] = wrapped[-1].rstrip() + "..."
                lines = wrapped
                total_text_height = len(lines) * (font_size + 8) + padding * 2
                if total_text_height <= box_height:
                    break
                font_size -= 2
            if font_size < min_font_size:
                font_size = min_font_size
                try:
                    font = ImageFont.truetype(font_path, font_size)
                except Exception:
                    font = ImageFont.load_default()
                wrapped = textwrap.wrap(translated, width=max_chars_per_line)
                if len(wrapped) > max_lines:
                    wrapped = wrapped[:max_lines]
                    wrapped[-1] = wrapped[-1].rstrip() + "..."
                lines = wrapped

            box_top = y + panel_height - box_height
            box_bottom = y + panel_height
            draw.rectangle(
                [x, box_top, x + panel_width, box_bottom],
                fill=box_fill,
                outline=box_outline
            )

            text_y = box_top + padding
            for line in lines:
                draw.text((x + padding, text_y), line, fill=text_color, font=font)
                text_y += font_size + 8

        return img

    async def generate(self, text: str, gender: str = "male") -> dict:
        try:
            # 1. 스크립트 생성
            scenes = await self.get_script(text, gender)
            
            # 2. DALL-E 프롬프트 생성
            prompt = await self.build_combined_prompt(scenes, gender)
            
            # 3. 이미지 생성 (실패 시 기본 이미지 사용)
            try:
                comic_img = await self.generate_combined_image(prompt)
                print("✅ DALL-E 이미지 생성 성공")
            except Exception as img_error:
                print(f"⚠️ DALL-E 이미지 생성 실패: {img_error}")
                print("🔄 기본 이미지 사용")
                comic_img = self._create_default_image()
            
            # 4. 텍스트 추가
            comic_img = await self.add_text_boxes_to_combined_image(comic_img, scenes)
            
            # 5. 이미지 저장
            filename = f"comic_{uuid.uuid4().hex[:8]}.png"
            output_dir = "outputs"
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, filename)
            comic_img.save(output_path)
            
            return {
                "comic_image_url": f"/outputs/{filename}",
                "generated_text": text
            }
            
        except Exception as e:
            raise Exception(f"Comic generation failed: {str(e)}")

    def _create_default_image(self) -> Image.Image:
        """기본 4컷 만화 이미지를 생성합니다."""
        # 1024x1024 크기의 기본 이미지 생성
        img = Image.new('RGB', (1024, 1024), color='white')
        draw = ImageDraw.Draw(img)
        
        # 2x2 그리드 그리기
        panel_width = 512
        panel_height = 512
        
        # 패널 경계선 그리기
        for i in range(1, 2):
            # 세로선
            draw.line([(i * panel_width, 0), (i * panel_width, 1024)], fill='black', width=2)
            # 가로선
            draw.line([(0, i * panel_height), (1024, i * panel_height)], fill='black', width=2)
        
        # 각 패널에 기본 텍스트 추가
        positions = [
            (0, 0), (panel_width, 0),
            (0, panel_height), (panel_width, panel_height)
        ]
        
        for i, (x, y) in enumerate(positions, 1):
            text = f"Panel {i}"
            # 텍스트를 패널 중앙에 배치
            text_x = x + panel_width // 2 - 50
            text_y = y + panel_height // 2 - 10
            draw.text((text_x, text_y), text, fill='black')
        
        return img

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await http_client.aclose() 