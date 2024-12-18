import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

// Create an AudioContext
const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const [frequencyData, setFrequencyData] = useState({
    low: 0,
    lowmid :0,
    mid:0,
    highmid:0,
    treble: 0,
    amplitude: 0,
  });
  
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    async function setupMicrophone() {
      const stream = await navigator.mediaDevices.getUserMedia({audio: { deviceId: { exact: "8b611642c40261728ee2ce7e26725f3e9415e292d1c22213a37640fb6e98f9ff" } }});
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      // Create an AnalyserNode for frequency analysis
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // Smaller fftSize for more responsive data
      analyser.smoothingTimeConstant = 0.9;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      // console.log(analyser.frequencyBinCount)
      // console.log(audioContext.sampleRate)
      source.connect(analyser);
    }

    setupMicrophone();

    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
    };
  }, []);

  useFrame(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);


    //bass = [20, 140];
    // lowMid = [140, 400];
    // mid = [400, 2600];
    // highMid = [2600, 5200];
    // treble = [5200, 14000];
      // Divide the frequency data into bass, mid, and treble ranges
      const lowData = dataArrayRef.current.slice(0, 1); // Low frequencies
      const lowmidData = dataArrayRef.current.slice(1, 2); // Mid-range frequencies
      const midData = dataArrayRef.current.slice(2, 7); // Mid-range frequencies
      const highmidData = dataArrayRef.current.slice(7, 14); // Mid-range frequencies
      const highData = dataArrayRef.current.slice(14, dataArrayRef.current.length); // High frequencies

    // Calculate the average frequency value for each range of frequencies

      const low = lowData.reduce((acc, val) => acc + val, 0) / (lowData.length *256)|| 0;
      const lowmid = lowmidData.reduce((acc, val) => acc + val, 0) / (lowmidData.length*256) || 0;
      const mid = midData.reduce((acc, val) => acc + val, 0) / (midData.length*256) || 0;
      const highmid = highmidData.reduce((acc, val) => acc + val, 0) / (highmidData.length*256) || 0;
      const high = highData.reduce((acc, val) => acc + val, 0) / (highData.length*256) || 0;

      // Calculate the overall amplitude as an average of all frequency values
      const amplitude = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;

      // Update state with the frequency ranges and amplitude
      setFrequencyData({
        low,
        lowmid,
        mid,
        highmid,
        high,
        amplitude,
      });
    }
  });

  return (
    <AudioContext.Provider value={frequencyData}>
      {children}
    </AudioContext.Provider>
  );
}

