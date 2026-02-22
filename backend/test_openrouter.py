import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def test_analysis():
    if not OPENROUTER_API_KEY:
        print("ERROR: No API Key found")
        return

    model_name = "google/gemini-2.0-flash-001"
    prompt = "Test: Say hello"
    
    messages = [
        {"role": "user", "content": prompt}
    ]

    try:
        print(f"DEBUG: Testing OpenRouter with {model_name}...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": messages
            },
            timeout=15
        )
        print(f"STATUS CODE: {response.status_code}")
        if response.status_code != 200:
            print(f"ERROR RESPONSE: {response.text}")
        else:
            print(f"SUCCESS: {response.json()['choices'][0]['message']['content']}")
            
    except Exception as e:
        print(f"EXCEPTION: {str(e)}")

def test_multimodal():
    if not OPENROUTER_API_KEY:
        print("ERROR: No API Key found")
        return

    model_name = "google/gemini-2.0-flash-001"
    # Small transparent 1x1 PNG in base64
    base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What is in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}"
                    }
                }
            ]
        }
    ]

    try:
        print(f"DEBUG: Testing Multimodal OpenRouter with {model_name}...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model_name,
                "messages": messages
            },
            timeout=25
        )
        print(f"STATUS CODE: {response.status_code}")
        if response.status_code != 200:
            print(f"ERROR RESPONSE: {response.text}")
        else:
            print(f"SUCCESS: {response.json()['choices'][0]['message']['content']}")
            
    except Exception as e:
        print(f"EXCEPTION: {str(e)}")

if __name__ == "__main__":
    print("--- TEXT TEST ---")
    test_analysis()
    print("\n--- MULTIMODAL TEST ---")
    test_multimodal()
