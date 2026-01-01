---
title: FrameMatch
emoji: 📷
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# FrameMatch

AI-powered shot analysis tool for photographers and cinematographers.

Upload a reference image and get:
- **Focal length estimation** from perspective analysis
- **Lighting direction** and quality detection
- **Color palette** extraction
- **Recreation guide** with step-by-step instructions

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: Python FastAPI + Pillow + NumPy

## Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173
