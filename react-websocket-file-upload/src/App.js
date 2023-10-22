import React, { useState, useEffect } from 'react';
import MyPieChart from './MyPieChart';  // Import the pie chart component
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('response', (data) => {
      setMessage(data);
    });
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const [showChart, setShowChart] = useState(false); 
  const [fileUploadedTimestamp, setFileUploadedTimestamp] = useState(Date.now()); 
 

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    socket.emit('process', data.filename);
    setShowChart(true); 
    // Update the timestamp every time a file is uploaded
    setFileUploadedTimestamp(Date.now());  
  };

  return (
    <div className="App">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <main>
        {showChart && <MyPieChart lastUpdated={fileUploadedTimestamp} />}
      </main>
    </div>
    
  );
}

export default App;
