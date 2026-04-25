import json
import os
from datetime import datetime

import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Error: GEMINI_API_KEY missing")

CHATLOG_FILE = "Data/ChatLog.json"
MODEL_NAME = "gemini-2.5-flash-lite"

SYSTEM_INSTRUCTION = """
You are MATE (MindCare AI).
You are an empathetic, caring, and supportive AI assistant.
Your goal is to help the user with their mental health and daily tasks.
You understand and can speak in Hinglish (a mix of Hindi and English) flawlessly. If the user speaks in Hinglish or Hindi, reply naturally in Hinglish.
Keep your answers concise, human-like, and warm.
"""

# MongoDB Connection Setup
try:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://DEEP_MINDCARE:NPOWl9KnImbJ5h6n@cluster0.bhk1ylj.mongodb.net/mind-care?appName=Cluster0")
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client['mind-care']
    jarvis_collection = db['JARVIS']
    print("✅ Connected to MongoDB 'mindcare' database.")
except Exception as e:
    print(f"⚠️ Could not connect to MongoDB: {e}")
    jarvis_collection = None


def load_chatlog(user_id):
    """Loads the chat history for a specific user from MongoDB or JSON fallback."""
    if jarvis_collection is not None:
        try:
            # Load the single document for this user
            user_doc = jarvis_collection.find_one({"user_id": user_id})
            history = []
            if user_doc and "conversations" in user_doc:
                # Load only the latest 3 conversations from the array
                recent_conversations = user_doc["conversations"][-3:]
                for record in recent_conversations:
                    if record.get("user_message"):
                        history.append({"role": "user", "content": record["user_message"]})
                    if record.get("ai_response"):
                        history.append({"role": "assistant", "content": record["ai_response"]})
            return history
        except Exception as e:
            print(f"⚠️ Error loading from MongoDB: {e}")

    # Fallback to JSON file if MongoDB is unavailable
    try:
        with open(CHATLOG_FILE, "r", encoding="utf-8") as f:
            all_users_history = json.load(f)
            # Support both old flat-array format and new dictionary format
            if isinstance(all_users_history, dict):
                return all_users_history.get(user_id, [])[-6:]
            elif isinstance(all_users_history, list) and user_id == "guest":
                return all_users_history[-6:]
            return []
    except Exception:
        return []


def save_chatlog(history, user_id):
    """Saves the latest chat history back to the database and JSON fallback."""
    # Save to JSON file as a fallback, separated by user_id
    os.makedirs("Data", exist_ok=True)
    try:
        with open(CHATLOG_FILE, "r", encoding="utf-8") as f:
            all_users_history = json.load(f)
            if not isinstance(all_users_history, dict):
                all_users_history = {}
    except Exception:
        all_users_history = {}

    all_users_history[user_id] = history
    with open(CHATLOG_FILE, "w", encoding="utf-8") as f:
        json.dump(all_users_history, f, indent=4, ensure_ascii=False)

    # Save to MongoDB
    if jarvis_collection is not None:
        try:
            # We save the latest message pair (User and Assistant)
            if len(history) >= 2:
                latest_user = history[-2]
                latest_assistant = history[-1]

                new_message_pair = {
                    "timestamp": datetime.utcnow(),
                    "user_message": latest_user.get("content"),
                    "ai_response": latest_assistant.get("content")
                }
                
                # Push the new interaction into the user's personal array
                jarvis_collection.update_one(
                    {"user_id": user_id},
                    {"$push": {"conversations": new_message_pair}},
                    upsert=True
                )
        except Exception as e:
            print(f"⚠️ Error saving to MongoDB: {e}")


def chatbot(query, user_id="guest"):
    """Main chatbot processing function that communicates with Gemini."""
    try:
        history = load_chatlog(user_id)

        # Format history for Gemini
        gemini_history = []
        for msg in history[-6:]:  # Reduce context to speed up response
            role = "user" if msg.get("role") == "user" else "model"
            content = str(msg.get("content", ""))
            if content:
                gemini_history.append({"role": role, "parts": [content]})

        model = genai.GenerativeModel(model_name=MODEL_NAME, system_instruction=SYSTEM_INSTRUCTION)
        chat = model.start_chat(history=gemini_history)

        response = chat.send_message(query)
        answer = response.text.strip()

        history.append({"role": "user", "content": query})
        history.append({"role": "assistant", "content": answer})
        save_chatlog(history, user_id)

        return answer

    except Exception as e:
        error_msg = str(e)
        print(f"[BRAIN ERROR] Could not connect to {MODEL_NAME}: {error_msg}")
        if "429" in error_msg or "quota" in error_msg.lower():
            return "I'm sorry, but my Gemini API key has exceeded its daily free quota. Please provide a new API key or wait for the quota to reset."
        return "I'm having trouble thinking right now. Please try again later."