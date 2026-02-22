import fitz  # PyMuPDF
import google.generativeai as genai
from PIL import Image
import io
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file provided as bytes."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def encode_image(image_bytes):
    """Encodes image bytes as base64 string."""
    return base64.b64encode(image_bytes).decode('utf-8')

async def analyze_medical_report(extraction_res: str, is_image: bool = False, file_bytes: bytes = None, is_pdf: bool = False, language: str = "English"):
    """
    Analyzes medical report text, image, or PDF using OpenRouter API.
    Returns a simplified explanation for patients.
    """
    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY is not set in .env file.")

    # Using stable OpenRouter models
    model_name = "google/gemini-2.0-flash-001" # Multimodal and high performance
    
    analyzer_prompt = """
    You are 'MedClare AI'. Analyze the medical report.
    First, find the PATIENT AGE (look for 'Age', 'Yrs', 'Years' or Y/O).
    
    Respond strictly in this format:
    ---
    AGE: [Detected Age, e.g., 14]
    ---
    RAW_DATA: [Transcribe all values, findings, and text from the report accurately]
    ---
    EXPLANATION: [An ultra-simple markdown summary for a 10-year-old in English]
    ---
    SUGGESTIONS: [3-4 specific, actionable health suggestions based on the findings in English]
    ---
    """

    messages = [{"role": "user", "content": []}]
    
    if (is_image or is_pdf) and file_bytes:
        img_data = file_bytes
        if is_pdf:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            pix = doc[0].get_pixmap()
            img_data = pix.tobytes("png")
        
        base64_image = encode_image(img_data)
        messages[0]["content"].append({
            "type": "text",
            "text": analyzer_prompt
        })
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{base64_image}"
            }
        })
    else:
        messages[0]["content"] = analyzer_prompt + f"\nText: {extraction_res}"

    try:
        print(f"DEBUG: Attempting analysis with OpenRouter ({model_name})...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": messages
            },
            timeout=45
        )
        
        if response.status_code != 200:
            print(f"ERROR: OpenRouter returned {response.status_code}: {response.text}")
            response.raise_for_status()

        data = response.json()
        full_text = data['choices'][0]['message']['content']
        print("DEBUG: Received AI analysis. Parsing...")
        
        raw_data = ""
        explanation = ""
        suggestions = ""
        age = "Unknown"
        
        # More resilient parsing
        if "AGE:" in full_text:
            age = full_text.split("AGE:")[1].split("---")[0].strip()

        if "RAW_DATA:" in full_text:
            raw_data = full_text.split("RAW_DATA:")[1].split("---")[0].strip()
        
        if "EXPLANATION:" in full_text:
            explanation = full_text.split("EXPLANATION:")[1].split("---")[0].strip()

        if "SUGGESTIONS:" in full_text:
            suggestions = full_text.split("SUGGESTIONS:")[1].split("---")[0].strip()
            
        if not explanation:
            print("WARNING: Could not parse EXPLANATION section. Using full text.")
            explanation = full_text
            raw_data = extraction_res if extraction_res else "See original scan"

        # --- PHASE 2: VERIFICATION & TONE ADJUSTMENT (IN ENGLISH) ---
        print(f"DEBUG: Starting Phase 2 (Verification) with detected Age: {age}...")
        
        tone_instruction = "professional, serious, and empathetic. Do not be commanding."
        try:
            age_int = int(''.join(filter(str.isdigit, age)))
            if age_int < 15:
                tone_instruction = "joyous, playful, and extremely encouraging. Use terms like 'Little Champ' or 'Superstar'. Use emojis. Do not be traumatizing."
            elif age_int >= 60:
                tone_instruction = "gentle, very clear, reassuring, and highly respectful. Focus on comfort and clarity."
        except:
            pass

        verifier_prompt = f"""
        Verify and refine this medical explanation and the suggestions against the raw data.
        
        PATIENT CONTEXT:
        - Age: {age}
        - Tone Required: {tone_instruction}
        - Language: English (REQUIRED)
        
        RAW DATA: {raw_data}
        DRAFT EXPLANATION: {explanation}
        DRAFT SUGGESTIONS: {suggestions}
        
        GOAL:
        Output the final verified Markdown analysis in English.
        
        STRUCTURE:
        1. Comprehensive Explanation.
        
        2. '### Key Recommendations' header (Ensure a blank line before this header).
        
        3. List of 3-4 bullet points (Use '* ' format with a space after the asterisk).
        
        IMPORTANT RULES:
        - USE STANDARD MARKDOWN ONLY. 
        - ENSURE DOUBLE NEWLINES between paragraphs, headers, and lists.
        - NEVER mention chatting, following up, or asking questions.
        - Output ONLY the final verified Markdown in English.
        """
        
        v_response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": verifier_prompt}]
            },
            timeout=45
        )
        v_response.raise_for_status()
        v_data = v_response.json()
        final_english_text = v_data['choices'][0]['message']['content']
        
        # --- PHASE 3: DIRECT TRANSLATION (IF NEEDED) ---
        final_text = final_english_text
        if language.lower() != "english":
            print(f"DEBUG: Translating 'Source of Truth' to {language}...")
            final_text = await translate_analysis(final_english_text, raw_data, language)
        
        print(f"DEBUG: Analysis complete with '{tone_instruction}' tone.")
        return {
            "analysis": final_text,
            "raw_data": raw_data
        }

    except Exception as e:
        print(f"ERROR: OpenRouter analysis lifecycle failed: {str(e)}")
        raise e

async def translate_analysis(draft_text: str, raw_data: str, language: str):
    """Translates analysis using OpenRouter."""
    if not OPENROUTER_API_KEY:
        return draft_text

    model_name = "google/gemini-2.0-flash-001"
    
    prompt = f"""
    You are 'MedClare Translator'. Translate this medical summary from English into {language}.
    
    IMPORTANT RULES:
    1. EXCLUSIVELY mirror the structure of the English source.
    2. Maintain the EXACT same headers (translated) and bullet points.
    3. Maintain the EXACT same tone (joyous for kids, serious for adults).
    4. ENSURE standard Markdown formatting (blank lines before headers and after items).
    5. No creative liberty. This is a direct translation task.
    
    SOURCE DATA (FACTS): {raw_data}
    ENGLISH SOURCE TO TRANSLATE: {draft_text}
    
    Final direct translation in {language}:
    """
    
    try:
        print(f"DEBUG: Attempting translation with OpenRouter ({model_name})...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            },
            json={
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except Exception as e:
        print(f"ERROR: OpenRouter translation failed: {str(e)}")
        return draft_text
