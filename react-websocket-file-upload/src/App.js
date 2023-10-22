import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('response', (data) => {
      setMessage(data);
    });
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // handleUpload();
  };

  const handleUpload = async () => {
    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setProcessing(false);
    setResultsAvailable(true);
    socket.emit('process', data.filename);
  };

  return (
    <div className="App">
      <header>
        <h1>Examlytics</h1>
      </header>
      <main>
        { processing ? (
          <div>
            <h2>Explanation of website.</h2>
              <div className="Drop-zone">
                <h3>Processing your document...</h3>
              <progress max="100" value="75"></progress>
              </div>
          </div>          
        ) : (
          resultsAvailable ? (
            <div className="Results">
              <p>Results</p>
            </div>
          ) : (
            <div>
              <h2>Explanation of website.</h2>
              <div className="Drop-zone" ondrop={console.log("Hi")}>
                <label for="upload-file" >Drag and drop a file or</label>
                <input id="upload-file" className="button" type="file" accept=".pdf" onChange={handleFileChange} required />
                <input className= "Upload-button" type="submit" value="Upload file" onClick={handleUpload} />
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
