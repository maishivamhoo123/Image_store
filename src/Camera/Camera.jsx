import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ Import for navigation

const Backend_Id = 'http://localhost:5000';
// https://backend-image-kn59.onrender.com

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageData, setImageData] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate(); // ✅ React Router navigation hook

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    setImageData(dataURL);
    setConfirmed(false); // reset

    // ✅ Stop the camera after capturing
    const stream = video.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };
  const triggerPrediction = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/predict`);
    alert('✅ Prediction triggered!\n' + res.data.message);
  } catch (error) {
    console.error(error);
    alert('❌ Prediction failed');
  }
};


  const uploadImage = async () => {
    setUploading(true);
    try {
      const blob = await fetch(imageData).then(res => res.blob());
      const formData = new FormData();
      formData.append('image', blob, 'captured.png');

      await axios.post(`${Backend_Id}/upload`, formData);
      alert('✅ Image uploaded to database!');
      setImageData(null); // reset after upload
    } catch (error) {
      console.error(error);
      alert('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const seePrediction = () => {
    navigate('/latest'); // ✅ Go to React route `/latest`
  };

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {!imageData && (
        <>
          <video ref={videoRef} autoPlay className="w-full border rounded" />
          <div className="mt-4 space-x-2">
            <button onClick={startCamera} className="bg-blue-500 text-white px-4 py-2 rounded">Start Camera</button>
            <button onClick={capturePhoto} className="bg-green-500 text-white px-4 py-2 rounded">Capture Photo</button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {imageData && !confirmed && (
        <div className="mt-4">
          <img src={imageData} alt="Preview" className="w-full rounded border" />
          <p className="mt-2 font-medium">📸 Is this image okay?</p>
          <div className="mt-2 space-x-2">
            <button onClick={() => setConfirmed(true)} className="bg-purple-600 text-white px-4 py-2 rounded">Yes, Upload</button>
            <button onClick={() => setImageData(null)} className="bg-red-500 text-white px-4 py-2 rounded">No, Retake</button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="mt-4">
          <p className="mb-2 font-medium">Uploading...</p>
          <button
            onClick={uploadImage}
            className="bg-indigo-600 text-white px-4 py-2 rounded mr-2"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Confirm & Upload'}
          </button>
          <button
  onClick={triggerPrediction}
  className="bg-orange-600 text-white px-4 py-2 rounded mt-2"
>
  🔁 Run Prediction
</button>
          <button
            onClick={seePrediction}
            className="bg-yellow-400 text-black px-4 py-2 rounded"
          >
            See Prediction
          </button>
          

        </div>
      )}
    </div>
  );
};

export default CameraCapture;
