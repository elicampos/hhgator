import React, { useState, useEffect } from 'react';
import MyPieChart from './MyPieChart'; 
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  // State to store the parsed categories data
  const [categoriesData, setCategoriesData] = useState({}); 

  useEffect(() => {
    socket.on('response', (data) => {
      const parsedData = JSON.parse(data);
      // Parse and store the categories data
      setCategoriesData(parsedData.Categories); 
      // Now we have results, so we set this to true
      setResultsAvailable(true); 
    });
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const [showChart, setShowChart] = useState(false);
  const [fileUploadedTimestamp, setFileUploadedTimestamp] = useState(Date.now());

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
    socket.emit('process', data.filename);
    setShowChart(true);
    setFileUploadedTimestamp(Date.now());
  };

  return (
    <div className="App">
      <header>
        <h1>Examlytics</h1>
      </header>
      <main>
        {processing ? (
          <div>
            <h2>Processing your document...</h2>
            <progress max="100" value="75"></progress>
          </div>
        ) : resultsAvailable ? (
          <div className="Results">
            <section id="section1">
              <h2>Categories</h2>
              <div className="Category-list">
                {Object.keys(categoriesData).map((categoryName) => {
                  const category = categoriesData[categoryName];
                  return (
                    <div key={categoryName}>
                      <h3>{categoryName}</h3>
                      <p>Questions Covered: {category['Questions Covered'].join(', ')}</p>
                      <div>
                        <h4>Tips and Tricks</h4>
                        <ul>
                          {category['Tips and Tricks'].map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4>Useful Formulas</h4>
                        <ul>
                          {category['Useful Formulas'].map((formula, index) => (
                            <li key={index}>{formula}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4>Category Summary</h4>
                        <p>{category['Category Summary']}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <div className="Right-side">
              <section id="section2">
                <h2>Topic Breakdown</h2>
                {showChart && <MyPieChart lastUpdated={fileUploadedTimestamp} />}
              </section>
            </div>
          </div>
        ) : (
          <div>
            <h2>Upload a file to begin...</h2>
            <div className="Drop-zone" onDrop={() => console.log('Dropped!')}>
              <label htmlFor="upload-file">Drag and drop a file or</label>
              <input id="upload-file" className="button" type="file" accept=".pdf" onChange={handleFileChange} required />
              <input className="Upload-button" type="submit" value="Upload file" onClick={handleUpload} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
