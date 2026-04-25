from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from nutrimate import generate_diet, calculate_bmi, bmi_type

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/diet', methods=['POST'])
def get_diet():
    user_data = request.json or {}
    try:
        # Provide defaults if missing
        user = {
            "gender": user_data.get("gender", "male"),
            "age": int(user_data.get("age", 25)),
            "weight": float(user_data.get("weight", 70)),
            "height": float(user_data.get("height", 175)),
            "goal": user_data.get("goal", "weight loss"),
            "condition": user_data.get("condition", "none"),
            "lifestyle": user_data.get("lifestyle", "moderate"),
            "diet_type": user_data.get("diet_type", "vegetarian")
        }
        user["bmi"] = calculate_bmi(user["weight"], user["height"])
        user["type"] = bmi_type(user["bmi"])
        
        diet_plan = generate_diet(user)
        return jsonify({
            "bmi": user["bmi"],
            "type": user["type"],
            "diet_plan": diet_plan
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5004))
    app.run(host="0.0.0.0", port=port)
