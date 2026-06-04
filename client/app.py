import os
from flask import Flask, request, jsonify
from google.cloud import vision

# Set up Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "your-service-account.json"

app = Flask(__name__)
client = vision.ImageAnnotatorClient()

@app.route("/verify-id", methods=["POST"])
def verify_id():
    file = request.files["image"]
    content = file.read()
    image = vision.Image(content=content)

    response = client.text_detection(image=image)
    texts = response.text_annotations
    if texts:
        return jsonify({"status": "Valid ID detected", "text": texts[0].description})
    else:
        return jsonify({"status": "Invalid ID"})

if __name__ == "__main__":
    app.run(debug=True)
