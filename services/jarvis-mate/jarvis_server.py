from flask import Flask, request, jsonify
from flask_cors import CORS
from Backend.Chatbot import chatbot
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Configure CORS to allow frontend origins and credentials
CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5002",
    "http://127.0.0.1:5000",
    "https://adorable-taiyaki-e8b484.netlify.app"
])

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    query = data.get('message', '')
    user_id = data.get('userId', 'guest')
    if not query:
        return jsonify({"error": "No message provided"}), 400
    try:
        response = chatbot(query, user_id)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 👇 YEH PART CHANGE HAI
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)