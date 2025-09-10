from flask import Flask, request, jsonify, send_file
import qrcode
from pyzbar.pyzbar import decode
from PIL import Image
import os
from flask_cors import CORS
from io import BytesIO

app = Flask(__name__)
CORS(app)

# Create an 'uploads' directory if it doesn't exist
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Endpoint to generate a QR code from text, URL, or filename
@app.route("/generate", methods=["POST"])
def generate_qr():
    data = request.form.get("data")  # For text or URL
    file = request.files.get("file") # For file uploads

    if not data and not file:
        return jsonify({"error": "No data or file provided"}), 400

    # Use the filename as data if a file is uploaded, otherwise use the provided data
    qr_data = file.filename if file else data
    filename = os.path.join(UPLOAD_FOLDER, "generated_qr.png")

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)

    return send_file(filename, mimetype="image/png")



# Endpoint to decode a QR code from an uploaded image file
@app.route("/decode", methods=["POST"])
def decode_qr_image():
    if "qrfile" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["qrfile"]

    # Open directly from memory
    img = Image.open(BytesIO(file.read())).convert("L")
    decoded = decode(img)

    if decoded:
        result = [obj.data.decode("utf-8") for obj in decoded]
        return jsonify({"decoded": result})
    else:
        return jsonify({"decoded": None})

if __name__ == "__main__":
    app.run(debug=True)