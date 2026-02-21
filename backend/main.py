from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import google.generativeai as genai
import fitz  # PyMuPDF

load_dotenv()

app = FastAPI(title="Medical Report Intelligence System")

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
    return {"message": "Medical Report Intelligence System API is running"}

from utils import extract_text_from_pdf, analyze_medical_report

@app.post("/upload")
async def upload_report(file: UploadFile = File(...)):
    content_type = file.content_type
    file_bytes = await file.read()
    
    try:
        if content_type == "application/pdf":
            # Extract text from PDF
            text = extract_text_from_pdf(file_bytes)
            if not text.strip():
                # If no text (scanned PDF), use vision on the first page
                analysis = await analyze_medical_report("", is_pdf=True, file_bytes=file_bytes)
            else:
                # Digital PDF with text
                analysis = await analyze_medical_report(text)
        elif content_type in ["image/png", "image/jpeg", "image/jpg"]:
            # Process as image
            analysis = await analyze_medical_report("", is_image=True, file_bytes=file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or an Image.")
        
        return {
            "filename": file.filename,
            "analysis": analysis
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing report: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
