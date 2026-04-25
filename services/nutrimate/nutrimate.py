# ------------------------------
# 🖥️ MATE AI - FINAL VERSION (Gender + Diet Type)
# ------------------------------

import tkinter as tk
from tkinter import messagebox, scrolledtext
import os, json, threading, time
from google import genai
from dotenv import load_dotenv

# ------------------------------
# 🔐 API CONFIG
# ------------------------------
load_dotenv()
client = genai.Client(api_key=("AIzaSyCypPB_w4t0x6eNGsDCfmwwOD1900WZXus"))

MODEL = "gemini-2.5-flash"
MEMORY_FILE = "user_memory.json"

# ------------------------------
# 💾 MEMORY (SAFE)
# ------------------------------
def load_memory():
    try:
        if os.path.exists(MEMORY_FILE):
            with open(MEMORY_FILE, "r") as f:
                return json.load(f)
    except:
        return {}
    return {}

def save_memory(data):
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=4)

# ------------------------------
# 📊 BMI
# ------------------------------
def calculate_bmi(w, h):
    return round(w / ((h / 100) ** 2), 2)

def bmi_type(b):
    if b < 18.5:
        return "Underweight"
    elif b < 25:
        return "Normal"
    elif b < 30:
        return "Overweight"
    else:
        return "Obese"

# ------------------------------
# 🧠 GEMINI AI
# ------------------------------
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

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text

# ------------------------------
# 🎬 ANIMATION
# ------------------------------
def type_text(text):
    output.delete(1.0, tk.END)
    for char in text:
        output.insert(tk.END, char)
        output.update()
        time.sleep(0.008)

# ------------------------------
# 🎯 MAIN FUNCTION
# ------------------------------
def run_ai():

    def process():

        name = name_entry.get().strip()

        if not name:
            messagebox.showerror("Error", "Enter name")
            return

        mem = load_memory()

        # EXISTING USER
        if name in mem:
            user = mem[name]

            user.setdefault("diet_type", "vegetarian")
            user.setdefault("condition", "none")
            user.setdefault("lifestyle", "moderate")
            user.setdefault("goal", "weight loss")
            user.setdefault("gender", "male")

        # NEW USER
        else:
            try:
                user = {
                    "name": name,
                    "age": int(age_entry.get()),
                    "weight": float(weight_entry.get()),
                    "height": float(height_entry.get()),
                    "goal": goal_var.get(),
                    "condition": condition_var.get(),
                    "lifestyle": lifestyle_var.get(),
                    "diet_type": diet_type_var.get(),
                    "gender": gender_var.get()
                }
            except:
                messagebox.showerror("Error", "Invalid input")
                return

        # BMI
        user["bmi"] = calculate_bmi(user["weight"], user["height"])
        user["type"] = bmi_type(user["bmi"])

        type_text("🔄 Generating your personalized diet...\n")

        try:
            result = generate_diet(user)

            final = f"📊 BMI: {user['bmi']} ({user['type']})\n👤 Gender: {user['gender']}\n\n{result}"

            type_text(final)

            mem[name] = user
            save_memory(mem)

        except Exception as e:
            messagebox.showerror("Error", str(e))

    threading.Thread(target=process).start()

# ------------------------------
# 🎨 GUI DESIGN
# ------------------------------
if __name__ == "__main__":
    root = tk.Tk()
    root.title("MATE AI")
    root.geometry("750x850")
    root.configure(bg="white")

    # Heading
    tk.Label(root,
             text="MATE AI",
             font=("Segoe UI", 30, "bold"),
             bg="white",
             fg="#2563eb").pack(pady=20)

    form = tk.Frame(root, bg="white")
    form.pack()

    def label(text, r):
        tk.Label(form,
                 text=text,
                 font=("Segoe UI", 12, "bold"),
                 bg="white").grid(row=r, column=0, pady=10, padx=15, sticky="w")

    def entry(r):
        e = tk.Entry(form,
                     font=("Segoe UI", 12),
                     bg="#FFDAB9",
                     width=30)
        e.grid(row=r, column=1, pady=10)
        return e

    # Inputs
    label("Name", 0)
    name_entry = entry(0)

    label("Age", 1)
    age_entry = entry(1)

    label("Weight (kg)", 2)
    weight_entry = entry(2)

    label("Height (cm)", 3)
    height_entry = entry(3)

    # Dropdowns
    goal_var = tk.StringVar(value="weight loss")
    condition_var = tk.StringVar(value="none")
    lifestyle_var = tk.StringVar(value="moderate")
    diet_type_var = tk.StringVar(value="vegetarian")
    gender_var = tk.StringVar(value="male")

    def dropdown(var, options, r):
        menu = tk.OptionMenu(form, var, *options)
        menu.config(font=("Segoe UI", 11), bg="#FFDAB9")
        menu.grid(row=r, column=1, pady=10)

    label("Goal", 4)
    dropdown(goal_var, ["weight loss", "muscle gain", "maintenance"], 4)

    label("Condition", 5)
    dropdown(condition_var, ["none", "diabetes", "pcos"], 5)

    label("Lifestyle", 6)
    dropdown(lifestyle_var, ["sedentary", "moderate", "active"], 6)

    label("Diet Type", 7)
    dropdown(diet_type_var, ["vegetarian", "non-vegetarian", "vegan"], 7)

    # 🆕 GENDER OPTION
    label("Gender", 8)
    dropdown(gender_var, ["male", "female", "transgender"], 8)

    # Button
    tk.Button(root,
              text="✨ Generate Diet Plan",
              command=run_ai,
              bg="#2563eb",
              fg="white",
              font=("Segoe UI", 14, "bold"),
              width=25,
              height=2).pack(pady=20)

    # Output Frame
    output_frame = tk.Frame(root, bg="white", bd=2, relief="groove")
    output_frame.pack(pady=15, padx=20, fill="both", expand=True)

    output = scrolledtext.ScrolledText(
        output_frame,
        font=("Segoe UI", 12, "bold"),
        bg="white",
        fg="black",
        wrap=tk.WORD,
        bd=0
    )
    output.pack(fill="both", expand=True, padx=10, pady=10)

    # Run
    root.mainloop()