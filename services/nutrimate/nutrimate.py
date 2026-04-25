import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


def calculate_bmi(weight, height_cm):
    return round(weight / ((height_cm / 100) ** 2), 2)


def bmi_type(bmi):
    if bmi < 18.5:
        return "Underweight"
    if bmi < 25:
        return "Normal"
    if bmi < 30:
        return "Overweight"
    return "Obese"


def generate_diet(user):
    prompt = f"""
    Create a SHORT Indian diet plan.

    Gender: {user['gender']}
    Age:{user['age']}
    Weight:{user['weight']}
    Height:{user['height']}
    BMI:{user['bmi']} ({user['type']})
    Goal:{user['goal']}
    Condition:{user['condition']}
    Lifestyle:{user['lifestyle']}
    Diet Preference:{user['diet_type']}

    Rules:
    - Adjust diet based on gender needs (male/female/transgender)
    - Follow selected diet strictly (veg/non-veg/vegan)
    - Affordable Indian foods only

    Output:
    Morning:
    Breakfast:
    Lunch:
    Snack:
    Dinner:
    Calories:
    Tips (3):
    Add 2 lines about "Stay Happy"
    """
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return response.text
