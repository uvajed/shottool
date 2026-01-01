# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FrameMatch is an AI-powered web tool for photographers and cinematographers that analyzes reference images and provides recreation guides with camera settings, lighting analysis, and color grading recommendations.

**Live deployments:**
- Frontend: https://framematch.pages.dev (Cloudflare Pages)
- Backend API: https://kingune-framematch.hf.space (HuggingFace Spaces)

## Tech Stack

- **Frontend**: React 19 + Vite 7 + TailwindCSS 4
- **Backend**: Python 3.12 + FastAPI + Pillow + NumPy + ColorThief
- **Deployment**: Cloudflare Pages (frontend), HuggingFace Spaces with Docker (backend)

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server at localhost:5173
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker (HuggingFace Spaces)
```bash
# Build combined container (serves both frontend and backend)
docker build -t framematch .
docker run -p 7860:7860 framematch
```

## Project Structure

```
framematch/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Main app with upload flow
│   │   ├── main.jsx                   # React entry point
│   │   └── components/
│   │       ├── ImageUploader.jsx      # Drag-drop image upload
│   │       ├── LoadingAnalysis.jsx    # Loading spinner
│   │       ├── AnalysisResults.jsx    # Results container
│   │       ├── CameraPanel.jsx        # Camera settings display
│   │       ├── LightingPanel.jsx      # Lighting analysis display
│   │       ├── ColorPanel.jsx         # Color palette display
│   │       └── LightingDiagram.jsx    # Visual lighting diagram
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI endpoints
│   │   └── services/
│   │       └── analyzer.py            # ImageAnalyzer class
│   ├── requirements.txt
│   └── Dockerfile
├── Dockerfile                         # Combined Docker for HF Spaces
├── render.yaml                        # Render deployment config
└── README.md                          # HuggingFace Spaces metadata
```

## API Endpoints

- `POST /api/analyze` - Upload image, returns analysis JSON
- `GET /api/health` - Health check endpoint

## Key Analysis Features

### Camera Analysis (`backend/app/services/analyzer.py:29`)
- **Focal length estimation**: Uses edge sharpness falloff, vignetting, and gradient variance to detect wide vs telephoto lenses
- **Aperture/DoF**: Based on edge variance in grayscale image
- **ISO hint**: Based on overall brightness
- **Shutter speed**: Motion blur detection via Laplacian variance

### Lighting Analysis (`backend/app/services/analyzer.py:205`)
- Key light direction (left/right/frontal) via brightness comparison
- Vertical angle estimation
- Light quality (hard/soft) via contrast measurement
- Lighting patterns: Split, Rembrandt, Butterfly, Loop

### Color Analysis (`backend/app/services/analyzer.py:312`)
- Color palette extraction using ColorThief
- Temperature detection (warm/cool/neutral)
- Shadow and highlight tint analysis
- Saturation and contrast levels

## Environment Variables

- `VITE_API_URL` - Backend API URL for frontend (empty for same-origin in Docker)

## Deployment Notes

### Cloudflare Pages (Frontend)
- Deploy from `frontend` directory
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL=https://kingune-framematch.hf.space` in environment

### HuggingFace Spaces (Backend)
- Uses root `Dockerfile` for combined deployment
- SDK: Docker
- Port: 7860
- Nginx proxies `/api` to uvicorn on port 8000

## Known Issues & Solutions

1. **JSON serialization errors with numpy**: Wrap numpy boolean comparisons with `bool()` before returning in API responses
2. **scipy installation failures on HF Spaces**: Avoid scipy dependency; use simple algorithms instead
3. **Focal length always showing same value**: The `_estimate_focal_length` method analyzes edge sharpness falloff, vignetting, and gradient variance

## Code Style

- Frontend: React functional components with hooks, amber/orange color theme (avoid purple/violet)
- Backend: Python type hints, descriptive method names
- Keep dependencies minimal for HF Spaces compatibility
