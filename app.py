from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    filename = file.filename
    file.save(os.path.join('uploads', filename))
    return jsonify({"filename": filename})

@socketio.on('process')
def handle_process(filename):
    # Simulate some processing on the uploaded file
    # Replace this with your actual processing logic
    socketio.emit('response', f'Processed file: {filename}')

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
