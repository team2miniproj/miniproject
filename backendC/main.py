from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os, uuid, io, textwrap
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, storage
from services.comic_generator import ComicGenerator
# 환경설정 및 초기화
load_dotenv()
cred = credentials.Certificate("diaryemo-5e11e-firebase-adminsdk-fbsvc-3960bbf582.json")
firebase_admin.initialize_app(cred, {'storageBucket': 'diaryemo-5e11e.firebasestorage.app'})
bucket = storage.bucket()
print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
comic_generator = ComicGenerator()
font_path = os.path.join(os.path.dirname(__file__), "Danjo-bold-Regular.otf")

class DiaryComicRequest(BaseModel):
    raw_text: str
    user_name: str = "나"
    gender: str = "female"

def generate_diary_text(text: str) -> str:
    prompt = f"""
    사용자가 대충 음성으로 녹음해서 텍스트로 변환된 내용이에요. 일기로 만들면 되요. 더하거나 덜지 말고 자연스럽게 만드세요. 내용 전체를 표현하는 감정 이모지도 전달하세요.
    "{text}"
    일기 형식으로 정리된 글:
    """
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  
        messages=[
            {"role": "system", "content": "너는 사용자의 하루를 정리해주는 일기 작가야."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=600
    )
    return response.choices[0].message.content

# (get_script, translate_text_to_korean, build_combined_prompt, generate_combined_image, add_text_boxes_to_combined_image 함수는 이전 답변과 동일)

# @app.post("/api/diary-comic")
# async def diary_comic(req: DiaryComicRequest):
#     # 더미 일기체 텍스트와 더미 이미지 URL 반환
#     dummy_diary_text = "😊 오늘은 임시 데이터로 테스트하는 중입니다. OpenAI 없이도 잘 동작해요!"
#     dummy_image_url = "https://placehold.co/600x600/png?text=Dummy+Comic"
#     return {
#         "success": True,
#         "diary_text": dummy_diary_text,
#         "comic_image_url": dummy_image_url
#     }
@app.post("/api/diary-comic")
async def diary_comic(req: DiaryComicRequest):
    try:
        diary_text = generate_diary_text(req.raw_text)
        scenes = await comic_generator.get_script(diary_text, req.gender)
        prompt = await comic_generator.build_combined_prompt(scenes, req.gender)
        comic_img = await comic_generator.generate_combined_image(prompt)
        comic_img = await comic_generator.add_text_boxes_to_combined_image(comic_img, scenes, font_path=font_path)
        # 4. 이미지 저장 및 업로드
        filename = f"comic_{uuid.uuid4().hex[:8]}.png"
        output_dir = "outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)
        comic_img.save(output_path)
        blob = bucket.blob(f"comics/{filename}")
        blob.upload_from_filename(output_path)
        blob.make_public()
        public_url = blob.public_url
        return {
            "success": True,
            "diary_text": diary_text,
            "comic_image_url": public_url
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})