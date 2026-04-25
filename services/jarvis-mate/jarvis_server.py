from flask import Flask, request, jsonify
from flask_cors import CORS
from Backend.Chatbot import chatbot

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(port=5003, host='0.0.0.0')
