from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import os
import requests
import json
from PyPDF2 import PdfReader 

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app)

# Get OpenAI API key from environment variables
api_key = ""

@app.route('/upload', methods=['POST'])
def upload_file():
    # Receive the uploaded file
    file = request.files['file']
    filename = file.filename
    filepath = os.path.join('uploads', filename)
    file.save(filepath)

    # Convert the PDF to text
    pdf_text = convert_pdf_to_text(filepath)

    # Send the text to ChatGPT API and get the response
    response = chat_gpt_request(pdf_text)

    # Emit the response back to the frontend
    socketio.emit('response', response)

    return jsonify({"filename": filename})

def convert_pdf_to_text(filepath):
    # Open the PDF file
    pdf_file = open(filepath, 'rb')
    pdf_reader = PdfReader(pdf_file)  # Use PdfReader instead of PdfFileReader
    text = ""
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text()  # Use extract_text() method
    pdf_file.close()
    return text

def chat_gpt_request(text):
    # Define the prompt and other details for the GPT-4 model
    prompt = """Please analyze the provided exam PDF file and identify five specific categories that best represent the questions on the exam. Please ensure that the categories are not miscellaneous and are specific in representing the exam questions accurately.

    After carefully reviewing the solutions of the exam, please provide a few tricks or things to be careful of when solving the problems. These should be specific to each category identified earlier. Additionally, if there are any equations that are frequently used in the exam, please list them and explain their relevance to the specific categories.

    Please note that your response should be detailed, accurate, and provide specific information for each category and associated tricks or equations.
    
    Please Note that the responses should be formatted in json file syntax and should contain 5 categories under category. Then the section category should contains a section called "Questions" in which shows you which questions matched that catgeory(Note:Only one question per category, all category numbers must add up to orginal sum and will not always be in order), 
    then under category should be "Tips and Tricks section" in 
    which points out Non-trival facts a out how the problem was solved or a deeper explanation to keep in-mind when facing similar problems. Lastly under  category should be the formula that may serve, useful
    for those type of question, not don't write down any problem specfic value formulas, they should all be general formulas that can also be found online, and written without special characters. 
    Sample Output for one category in categories so u need 4 more:
    "Categories": {
    "DO NOT COPY(Topics)": {
      "Questions Covered": [DO NOT COPY(info),
      "Tips and Tricks": [
        DO NOT COPY(Info)"
      ],
      "Useful Formulas": [
        DO NOT COPY(Info)
      ]
    }

    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-4-0613",
        "messages": [
            {"role": "system", "content": "You are an assistant specialized in analyzing exam patterns."},
            {"role": "user", "content": f"Please analyze this exam that is mostly made from the text: {text}"},
            {"role": "user", "content": prompt}
        ]
    }
    # Make the API request
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
    print("API Response:", response.status_code, response.text)
    if response.status_code == 200:
        message_output = json.loads(response.text)["choices"][0]["message"]["content"]
        
        # Parse the JSON-like string into a Python dictionary
        organized_response = json.loads(message_output)
        
        # Convert the dictionary to a JSON string
        json_str = json.dumps(organized_response)
        
        # Write the JSON string to a file in the 'response' folder
        with open('responses/response.json', 'w') as f:
            f.write(json_str)
        
        return json_str
    else:
        error_response = {"error": f"Error: {response.status_code}"}
        
        # Write the error to a JSON file in the 'response' folder
        with open('responses/error.json', 'w') as f:
            f.write(json.dumps(error_response))
        
        return json.dumps(error_response)
    
@socketio.on('process')
def handle_process(filename):
    # This function can be used for other processing if needed
    pass

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)
    
