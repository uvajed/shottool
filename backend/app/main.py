from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io

from app.services.analyzer import ImageAnalyzer

app = FastAPI(
    title="FrameMatch API",
    description="Analyze reference images and provide recreation guides",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ImageAnalyzer()


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "framematch-api"}


@app.post("/api/analyze")
async def analyze_image(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await image.read()
        image_bytes = io.BytesIO(contents)

        result = analyzer.analyze(image_bytes)

        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
