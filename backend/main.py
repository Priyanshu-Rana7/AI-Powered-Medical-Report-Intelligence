from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import google.generativeai as genai
import fitz  # PyMuPDF

load_dotenv()

app = FastAPI(title="MedClare Medical AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@app.get("/")
async def root():
    return {
        "message": "Medical Report Intelligence System API is running",
        "status": "online",
        "version": "2.1.0"
    }

print("\n" + "="*50)
print("MEDCLARE BACKEND INITIALIZING...")
print(f"API KEY DETECTED: {'YES' if api_key else 'NO'}")
print("DEBUG: Routes registered: /, /upload, /translate")
print("="*50 + "\n")

from utils import extract_text_from_pdf, analyze_medical_report

@app.post("/upload")
async def upload_report(file: UploadFile = File(...), language: str = Form("English")):
    content_type = file.content_type
    file_bytes = await file.read()
    text = "" # Initialize to avoid UnboundLocalError
    
    try:
        if content_type == "application/pdf":
            # Extract text from PDF
            text = extract_text_from_pdf(file_bytes)
            if not text.strip():
                # If no text (scanned PDF), use vision
                result = await analyze_medical_report("", is_pdf=True, file_bytes=file_bytes, language=language)
            else:
                # Digital PDF with text
                result = await analyze_medical_report(text, language=language)
        elif content_type in ["image/png", "image/jpeg", "image/jpg"]:
            # Process as image
            result = await analyze_medical_report("", is_image=True, file_bytes=file_bytes, language=language)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        
        return {
            "filename": file.filename,
            "analysis": result["analysis"],
            "raw_text": result["raw_data"], # Use the AI-extracted raw data as the primary source
            "file_type": content_type
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing report: {str(e)}")

from pydantic import BaseModel

class TranslationRequest(BaseModel):
    text: str
    raw_text: str
    language: str

@app.post("/translate")
async def translate_report(request: TranslationRequest):
    print(f"DEBUG: Received translation request for {request.language}")
    try:
        from utils import translate_analysis
        translation = await translate_analysis(request.text, request.raw_text, request.language)
        return {"analysis": translation}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

print("DEBUG: Backend routes initialized: /root, /upload, /translate")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
