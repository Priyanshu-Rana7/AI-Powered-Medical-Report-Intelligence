import fitz  # PyMuPDF
import google.generativeai as genai
from PIL import Image
import io

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file provided as bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def clean_json_response(text: str) -> str:
    """Removes markdown code blocks and extra whitespace from AI response."""
    text = text.strip()
    if text.startswith("```"):
        # Remove opening ```json or ```
        text = text.split("\n", 1)[-1]
        # Remove closing ```
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()

async def analyze_medical_report(extraction_res: str, is_image: bool = False, file_bytes: bytes = None, is_pdf: bool = False, language: str = "English"):
    """
    Analyzes medical report text, image, or PDF using Gemini API.
    Returns a simplified explanation for patients.
    """
    # Using full IDs with 'models/' prefix for maximum compatibility
    model_names = [
        'models/gemini-2.0-flash', 
        'models/gemini-2.5-flash',
        'models/gemini-1.5-flash',
        'models/gemini-pro'
    ]
    
    last_error = None
    for model_name in model_names:
        try:
            print(f"DEBUG: Attempting analysis with {model_name}...")
            model = genai.GenerativeModel(model_name)
            
            # --- PHASE 1: EXTRACTION & ANALYSIS ---
            analyzer_prompt = f"""
            You are 'MedClare AI'. Analyze the medical report.
            Respond strictly in this format:
            ---
            RAW_DATA: [Transcribe all values, findings, and text from the report accurately]
            ---
            EXPLANATION: [An ultra-simple markdown summary for a 10-year-old in {language}]
            ---
            """
            
            if (is_image or is_pdf) and file_bytes:
                img_data = file_bytes
                if is_pdf:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    pix = doc[0].get_pixmap()
                    img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                res = model.generate_content([analyzer_prompt, img])
            else:
                res = model.generate_content(analyzer_prompt + f"\nText: {extraction_res}")
            
            full_text = res.text
            raw_data = ""
            explanation = ""
            
            if "RAW_DATA:" in full_text and "EXPLANATION:" in full_text:
                parts = full_text.split("---")
                for part in parts:
                    if "RAW_DATA:" in part:
                        raw_data = part.replace("RAW_DATA:", "").strip()
                    elif "EXPLANATION:" in part:
                        explanation = part.replace("EXPLANATION:", "").strip()
            else:
                explanation = full_text
                raw_data = extraction_res if extraction_res else "See original scan"

            # --- PHASE 2: VERIFICATION ---
            verifier_prompt = f"""
            Verify and refine this medical explanation against the raw data.
            RAW: {raw_data}
            DRAFT: {explanation}
            LANGUAGE: {language}
            
            Output ONLY final verified Markdown.
            """
            
            final_res = model.generate_content(verifier_prompt)
            return {
                "analysis": final_res.text,
                "raw_data": raw_data
            }

        except Exception as e:
            print(f"Log: Model {model_name} failed: {str(e)}")
            last_error = e
            continue
                
    raise last_error

async def translate_analysis(draft_text: str, raw_data: str, language: str):
    # Using confirmed stable models from diagnostics
    model_names = ['models/gemini-2.0-flash', 'models/gemini-2.5-flash', 'models/gemini-1.5-flash']
    for model_name in model_names:
        try:
            print(f"DEBUG: Attempting translation with {model_name}...")
            model = genai.GenerativeModel(model_name)
            
            prompt = f"""
            You are 'MedClare Translator'. Translate this medical summary into {language}.
            
            SOURCE DATA (FACTS): {raw_data}
            EXPLANATION TO TRANSLATE: {draft_text}
            
            RULES:
            1. Respond ONLY in {language}.
            2. Keep the simple, bulleted style.
            3. Accuracy is #1.
            
            Final Markdown in {language}:
            """
            
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text
            else:
                print(f"DEBUG: {model_name} returned empty response.")
        except Exception as e:
            print(f"DEBUG: {model_name} translation failed: {str(e)}")
            continue
    
    print("DEBUG: All translation models failed. Returning original text.")
    return draft_text
