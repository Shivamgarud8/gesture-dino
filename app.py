from flask import Flask, render_template, request, jsonify
import base64
import cv2
import numpy as np
from gestures.hand_detector import detect_fist
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/process_frame', methods=['POST'])
def process_frame():
    """
    Process video frame for hand gesture detection
    Returns JSON with jump status and hand landmarks
    """
    try:
        # Get image data from request
        data = request.json.get('image')
        if not data:
            return jsonify({"error": "No image data"}), 400
        
        # Decode base64 image
        encoded = data.split(',')[1]
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image data"}), 400
        
        # Detect fist gesture
        jump, landmarks = detect_fist(frame)
        
        # Return result
        return jsonify({
            "jump": jump,
            "landmarks": landmarks
        })
    
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return jsonify({
            "jump": False,
            "landmarks": [],
            "error": str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    logger.info("Starting Gesture Dino Game server...")
    app.run(host="0.0.0.0", port=5000, debug=True)
