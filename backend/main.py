from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os

app = FastAPI()

load_dotenv()  # Load environment variables from .env file

# === CORS Config ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["www.dionixsoftworks.ro", "dionixsoftworks.ro"],  # domeniul unde rulează React (vite)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic model ===
class ContactForm(BaseModel):
    name: str
    email: str
    project: str | None = None
    budget: str | None = None
    message: str

@app.post("/send-message")
async def send_message(data: ContactForm):

    
    text = f"""
📩 New Contact Message:
Name: {data.name}
Email: {data.email}
Project: {data.project}
Budget: {data.budget}
Message: {data.message}
    """

    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

    # print(text)

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    res = requests.post(url, data={"chat_id": TELEGRAM_CHAT_ID, "text": text})
    
    if res.status_code != 200:
        return {"status": "error", "details": res.text}

    return {"status": "ok", "message": "Sent to Telegram"}
