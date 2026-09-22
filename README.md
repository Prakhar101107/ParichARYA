# 🩺 ParichARYA (RxVoice)

> **Turn messy doctor handwriting into clear Hindi speech and simple visual charts.**

---

## 💡 What is this?

When doctors write prescriptions, they often write fast and use medical shorthand like:
`Tab. Azithro 500 OD x 3d` or `Pan-D 40 BBF`.

For many patients and elderly family members, this is almost impossible to read:
1. **The handwriting is messy**.
2. **Medical terms are confusing** (e.g., *OD* means once a day, *BBF* means before breakfast).
3. **Language barriers** make it even harder if the patient only understands Hindi or regional dialects[cite: 1].

**ParichARYA** solves this problem[cite: 1]. You take a picture of the paper prescription, and within 20 seconds, your phone reads the complete medicine routine aloud in Hindi and shows an easy picture chart[cite: 1].

---

## ✨ What Does It Do?

* 📸 **Scan Prescriptions:** Take a photo of the doctor's slip[cite: 1].
* 🤖 **Smart Reading:** Uses Google Cloud AI (Gemini) to figure out medicine names, doses, and meal timings[cite: 1].
* ✋ **Human Review Gate:** Before anything is saved or spoken, you can review and correct any word the AI isn't 100% sure about[cite: 1].
* ⚠️ **Safety Check:** Alerts you if two medicines shouldn't be taken together (e.g., taking two types of pain relief by mistake)[cite: 1].
* 🔊 **Speaks in Hindi:** Reads out your schedule clearly via high-quality voice audio[cite: 1].
* ☀️ **Picture Schedule:** Shows Sun, Moon, and Plate icons so anyone can understand when to take their pills without needing to read[cite: 1].

---

## 🛠️ How It Works (Simple Architecture)

1. **Frontend (Web/Mobile App):** You open the camera, snap the prescription, and view your schedule[cite: 1].
2. **Backend Server (FastAPI on Google Cloud Run):** Receives the image and coordinates the AI steps[cite: 1].
3. **Vertex AI (Gemini 2.5 Flash):** Reads the doctor's handwriting and expands abbreviations into plain sentences[cite: 1].
4. **Cloud Text-to-Speech:** Turns the Hindi text into natural voice audio[cite: 1].
5. **Firestore:** Safely stores your medication schedule so you can replay it anytime[cite: 1].

---

## 🚀 How to Run It Locally

### 1. Backend (Python)
```bash
# Go to the backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8080
