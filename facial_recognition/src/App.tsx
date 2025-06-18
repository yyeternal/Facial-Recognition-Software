import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { AgeAndGenderPrediction } from 'face-api.js';

function App() {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [facesData, setFacesData] = useState<any[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  const startWebcam = async () => {
    setIsWebcamOn(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const stopWebcam = () => {
    if (!videoRef.current) return;
    setIsWebcamOn(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    videoRef.current!.srcObject = null;
  };

  const detectFaces = async () => {
    if (!videoRef.current) return;
    const detections = await faceapi
      .detectAllFaces(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withAgeAndGender();

    setFacesData(detections);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };
    faceapi.matchDimensions(canvas, displaySize);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const context = canvas.getContext("2d"); 
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  };

  useEffect(() => {
    let interval: any;
    if (isWebcamOn) {
      interval = setInterval(detectFaces, 1000);
    }
    return () => clearInterval(interval);
  }, [isWebcamOn]);

  return (
    <div className="App">
      <h1 className="text-xl font-bold mb-4">Face Detection App</h1>
      <div className="relative w-full max-w-md">
        <video ref={videoRef} className="rounded w-full" width="640" height="480" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      </div>
      <div className="mt-4">
        {!isWebcamOn ? (
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={startWebcam}>
            Start Webcam
          </button>
        ) : (
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={stopWebcam}>
            Stop Webcam
          </button>
        )}
      </div>
      <div className="mt-4 w-full max-w-md">
        {facesData.map((face, index) => (
          <div key={index} className="bg-white shadow p-2 rounded mb-2">
            <p><strong>Face {index + 1}:</strong></p>
            <p>Age: {face.age.toFixed(0)}</p>
            <p>Gender: {face.gender}</p>
            <p>Gender Probability: {(face.genderProbability * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
