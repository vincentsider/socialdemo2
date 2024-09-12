# This is the backend of the project. and is being hosted on replit at this backend URL [insert your backend URL after entering secrets keys]

import os
import tempfile
import base64
import cv2
import time
import requests
from io import BytesIO
from typing import Tuple
import logging
import json

import anthropic
import replicate
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import firebase_admin
from firebase_admin import credentials, initialize_app, storage
from moviepy.editor import VideoFileClip
from pydub import AudioSegment

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)

# Set up various AI tools
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logging.error("OPENAI_API_KEY is not set in the environment variables.")
else:
    logging.info("OPENAI_API_KEY loaded successfully.")

replicate_api_token = os.getenv("REPLICATE_API_TOKEN")
if not replicate_api_token:
    logging.error("REPLICATE_API_TOKEN is not set in the environment variables.")
else:
    logging.info("REPLICATE_API_TOKEN loaded successfully.")

openai = OpenAI(api_key=openai_api_key)

# Initialize Firebase
firebase_config = {
    "apiKey": os.getenv("FIREBASE_API_KEY"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
    "appId": os.getenv("FIREBASE_APP_ID")
}

# Parse the JSON string from the environment variable
service_account_info = json.loads(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))

# Initialize Firebase with the service account info
cred = credentials.Certificate(service_account_info)
firebase_app = initialize_app(cred, firebase_config)

# Now you can use Firebase services in your backend
bucket = storage.bucket()

@app.route('/')
def hello():
    return "Welcome to the server template!"

# Endpoint for generating a response from OpenAI
@app.route('/openai/text', methods=['POST'])
def openai_generate_text():
    data = request.json
    prompt = data.get('prompt', '') if data else ''
    logging.debug(f"Received prompt: {prompt}")

    if not prompt or len(prompt) < 1:
        logging.error("No prompt provided or prompt is too short.")
        return jsonify({'error': 'Please provide a prompt'}), 400

    try:
        logging.info("Generating text using OpenAI API...")
        completion = openai.chat.completions.create(
            model="gpt-4o",  # Make sure this is a valid model name
            messages=[{
                "role": "system",
                "content": "You are a helpful assistant."
            }, {
                "role": "user",
                "content": f"{prompt}"
            }]
        )
        response = completion.choices[0].message.content.strip()
        logging.debug(f"Generated response: {response}")
        return jsonify({"response": response})
    except Exception as e:
        logging.error(f"Error generating text: {e}")
        return jsonify({"error": str(e)}), 500

# New endpoint for transcribing audio using OpenAI's Whisper
@app.route('/openai/transcribe', methods=['POST'])
def transcribe_audio() -> Tuple[Response, int]:
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename:
        try:
            # Get the file extension (default to .tmp if no extension)
            file_ext = os.path.splitext(file.filename)[1] or '.tmp'

            # Create a temporary file to store the uploaded audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                file.save(temp_file.name)
                temp_filename = temp_file.name

            # Transcribe the audio file
            with open(temp_filename, "rb") as audio_file:
                transcript = openai.audio.transcriptions.create(
                    model="whisper-1", file=audio_file)

            # Delete the temporary file
            os.unlink(temp_filename)

            return jsonify({"transcription": transcript.text}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # This should never be reached, but it's here to satisfy the type checker
    return jsonify({"error": "Unknown error"}), 500

# New endpoint for generating images using OpenAI
@app.route('/openai/image', methods=['POST'])
def openai_generate_image():
    data = request.json
    prompt = data.get('prompt', '') if data else ''
    if not prompt or len(prompt) < 1:
        return jsonify({'error': 'Please provide a prompt'}), 400

    try:
        response = openai.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
        return jsonify({"image_url": image_url})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint for generating a response from Anthropic
@app.route('/anthropic/text', methods=['POST'])
def anthropic_generate_text():
    data = request.json
    prompt = data.get('prompt', '') if data else ''
    if not prompt or len(prompt) < 1:
        return jsonify({'error': 'Please provide a prompt'}), 400
    try:
        message = anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0,
            system="You are a helpful assistant.",
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Extract the text content from the response
        response = message.content[0].text if message.content else ""

        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint for generating an image from Flux model
@app.route('/flux/image', methods=['POST'])
def flux_generate_image():
    data = request.json
    prompt = data.get('prompt', '') if data else ''
    if not prompt or len(prompt) < 1:
        return jsonify({'error': 'Please provide a prompt'}), 400
    try:
        image_urls = replicate.run("black-forest-labs/flux-schnell",
                                   input={
                                       "prompt": prompt,
                                       "num_outputs": 1,
                                       "aspect_ratio": "1:1",
                                       "output_format": "webp",
                                       "output_quality": 80
                                   })

        if image_urls and isinstance(image_urls, list) and len(image_urls) > 0:
            image_url = image_urls[0]
            return jsonify({"image_url": image_url})
        else:
            return jsonify({"error": "No image URL returned from the model"}), 500
    except Exception as e:
        logging.error(f"Error generating image: {e}")
        return jsonify({"error": str(e)}), 500

# New endpoint for generating text based on an uploaded image
@app.route('/openai/image-to-text', methods=['POST'])
def openai_image_to_text():
    data = request.json
    image_url = data.get('imageUrl', '')
    if not image_url:
        return jsonify({"error": "No image URL provided"}), 400

    try:
        # Generate text based on the image URL
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What's in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        return jsonify({"title": response.choices[0].message.content, "content": response.choices[0].message.content}), 200
    except Exception as e:
        logging.error(f"Error generating text from image: {e}")
        return jsonify({"error": str(e)}), 500

# New endpoint for processing and narrating a video
@app.route('/openai/video-to-text', methods=['POST'])
def openai_video_to_text():
    data = request.json
    video_url = data.get('videoUrl', '')
    if not video_url:
        return jsonify({"error": "No video URL provided"}), 400

    try:
        logging.info("Processing video...")

        # Download the video
        video_response = requests.get(video_url)
        video_path = tempfile.mktemp(suffix=".mp4")
        with open(video_path, 'wb') as f:
            f.write(video_response.content)

        # Extract frames from the video
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frames = []
        for i in range(frame_count):
            ret, frame = cap.read()
            if not ret:
                break
            if i % 60 == 0:  # Extract one frame every 60 frames
                _, buffer = cv2.imencode('.jpg', frame)
                frames.append(base64.b64encode(buffer).decode('utf-8'))
        cap.release()

        # Get video duration
        video_clip = VideoFileClip(video_path)
        video_duration = video_clip.duration
        video_clip.close()

        # Generate description using GPT-4o
        PROMPT_MESSAGES = [
            {
                "role": "user",
                "content": [
                    "These are frames from a video that I want to upload. Generate a compelling description that I can upload along with the video.",
                    *map(lambda x: {"image": x, "resize": 768}, frames),
                ],
            },
        ]
        params = {
            "model": "gpt-4o",
            "messages": PROMPT_MESSAGES,
            "max_tokens": 200,
        }
        description_result = openai.chat.completions.create(**params)
        description = description_result.choices[0].message.content

        # Generate voiceover script using GPT-4o
        PROMPT_MESSAGES = [
            {
                "role": "user",
                "content": [
                    f"These are frames of a video that is {video_duration:.2f} seconds long. Create a short voiceover script in the style of David Attenborough that matches this duration. Only include the narration.",
                    *map(lambda x: {"image": x, "resize": 768}, frames),
                ],
            },
        ]
        params = {
            "model": "gpt-4o",
            "messages": PROMPT_MESSAGES,
            "max_tokens": 500,
        }
        script_result = openai.chat.completions.create(**params)
        script = script_result.choices[0].message.content

        # Generate voiceover using OpenAI TTS API
        tts_response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {openai_api_key}",
            },
            json={
                "model": "tts-1-1106",
                "input": script,
                "voice": "onyx",
                "speed": 1.0,  # Adjust this value to match video duration if needed
            },
        )
        if tts_response.status_code == 401:
            return jsonify({"error": "Unauthorized access to OpenAI API"}), 401

        # Save audio to a temporary file
        audio_path = tempfile.mktemp(suffix=".mp3")
        with open(audio_path, 'wb') as f:
            for chunk in tts_response.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)

        # Adjust audio duration to match video
        audio = AudioSegment.from_mp3(audio_path)
        adjusted_audio = audio.set_frame_rate(int(len(audio) / video_duration * 1000))
        adjusted_audio.export(audio_path, format="mp3")

        # Upload the audio file to Firebase Storage
        blob = bucket.blob(f"audio/{os.path.basename(audio_path)}")
        blob.upload_from_filename(audio_path)

        # Make the blob publicly accessible
        blob.make_public()

        # Get the public URL of the uploaded audio file
        audio_url = blob.public_url

        # Delete the temporary files
        os.remove(audio_path)
        os.remove(video_path)

        return jsonify({"video_url": video_url, "description": description, "audio_url": audio_url}), 200
    except Exception as e:
        logging.error(f"Error processing video: {e}")
        return jsonify({"error": str(e)}), 500

# Endpoint for generating speech from text using OpenAI
@app.route('/openai/speech', methods=['POST'])
def openai_text_to_speech():
    data = request.json
    prompt = data.get('prompt', '') if data else ''
    voice_id = 'onyx'  # Default voice ID

    if not prompt or len(prompt) < 1:
        return jsonify({'error': 'Please provide a prompt'}), 400

    try:
        tts_response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {openai_api_key}",
            },
            json={
                "model": "tts-1-1106",
                "input": prompt,
                "voice": voice_id,
            },
        )
        if tts_response.status_code == 401:
            return jsonify({"error": "Unauthorized access to OpenAI API"}), 401

        audio_path = tempfile.mktemp(suffix=".mp3")
        with open(audio_path, 'wb') as f:
            for chunk in tts_response.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)

        # Create a BytesIO object from the audio content
        audio_io = BytesIO()
        with open(audio_path, 'rb') as f:
            audio_io.write(f.read())
        audio_io.seek(0)

        # Send the file back to the client
        return send_file(audio_io,
                         mimetype='audio/mpeg',
                         as_attachment=True,
                         download_name='tts_output.mp3')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Starts the Python server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)