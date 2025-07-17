from pydantic import BaseModel

class ComicGenerationInput(BaseModel):
    text: str
    gender: str = "male"  # 임시로 기본값을 male로 설정

class ComicGenerationOutput(BaseModel):
    comic_image_url: str
    generated_text: str
