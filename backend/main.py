from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import google.generativeai as genai
import fitz  # PyMuPDF
from pydantic import BaseModel

from utils import extract_text_from_pdf, analyze_medical_report

load_dotenv()

app = FastAPI(title="MedClare Medical AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Integration handled via OpenRouter in utils.py

@app.get("/")
async def root():
    return {
        "message": "Medical Report Intelligence System API is running",
        "status": "online",
        "version": "2.1.0"
    }

@app.post("/upload")
async def upload_report(file: UploadFile = File(...), language: str = Form("English")):
    content_type = file.content_type
    file_bytes = await file.read()
    
    try:
        if content_type == "application/pdf":
            text = extract_text_from_pdf(file_bytes)
            if not text.strip():
                result = await analyze_medical_report("", is_pdf=True, file_bytes=file_bytes, language=language)
            else:
                result = await analyze_medical_report(text, language=language)
        elif content_type in ["image/png", "image/jpeg", "image/jpg"]:
            result = await analyze_medical_report("", is_image=True, file_bytes=file_bytes, language=language)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        
        return {
            "filename": file.filename,
            "analysis": result["analysis"],
            "raw_text": result["raw_data"]
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing report: {str(e)}")

class TranslationRequest(BaseModel):
    text: str
    raw_text: str
    language: str

@app.post("/translate")
async def translate_report(request: TranslationRequest):
    try:
        from utils import translate_analysis
        translation = await translate_analysis(request.text, request.raw_text, request.language)
        return {"analysis": translation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
