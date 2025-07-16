from config.openai_client import client
def get_script(user_name:str,diary: str) -> list:
    
    prompt = f"""
    
You are a Japanese comic writer. The following diary entry is written by {user_name}.
Do not use speech bubbles. Do not use speaker label.
First, translate the diary entry to fluent English if it's not already in English.
Then, you must only use the data from the {diary} text to generate a 4-panel wholesome slice-of-life comic scenario only with sytle if there is male then "A handsome-looking Korean man in his late 20s with short black hair and glasses, wearing a hoodie." othewise "A sexy-looking Korean woman in her 20s with straight black hair." .

Each panel must include a 'Scene' and a 'Dialogue' in the following format:

[Panel 1]
Scene: ...
Dialogue: ...

[Panel 2]
...


Diary: {diary}
"""

    res = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    text = res.choices[0].message.content.strip()
    print("\n========== GPT RESPONSE START ==========")
    print(text)
    print("=========== GPT RESPONSE END ===========\n")

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




def build_combined_prompt(scenes: list, user_name: str, gender: str) -> str:
    
    prompt = (
           f"The main character is {user_name}, {gender}. For male character, use A handsome-looking Korean man in his late 20s with short black hair. For female character use A sexy-looking Japanese woman in her 20s with straight black hair.Do not use speech bubbles. Create a 4-panel wholesome slice-of-life comic. Each panel is described below:\n")
   
    for i, scene in enumerate(scenes, 1):
        prompt += f"[Panel {i}] Scene: {scene['scene']}. Dialogue: {scene['dialogue']}\n"
    prompt += (
        "Draw all 4 panels in a single 1024x1024 image, arranged in 2x2 layout. "
        "Do not include any text for image generation. Japanese style art, and consistent Korean characters for all characters. "
        "Avoid violence, sensitive topics, or anything that violates content policies."
    )
    return prompt
