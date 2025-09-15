"use client";

import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

const socket_results = new WebSocket("ws://localhost:6789");

function base64ToBlob(base64: string, mimeType: string = "image/jpeg"): Blob {
  const byteString = atob(base64.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeType });
}

const WebcamComponent: React.FC<{ detections: any[] }> = ({ detections }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current && socket_results?.readyState === WebSocket.OPEN) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          const blob = base64ToBlob(imageSrc);
          socket_results.send(blob);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !detections) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det: any) => {
      const { x, y, width, height, class_name, score } = det;

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "lime";
      ctx.font = "12px Arial";
      ctx.fillText(`${class_name} (${(score * 100).toFixed(1)}%)`, x, y - 5);
    });
  }, [detections]);

  return (
    <div className="relative w-[320px] h-[240px] bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-lg">
      <Webcam
        audio={false}
        ref={webcamRef}
        width={320}
        height={240}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 320,
          height: 240,
          facingMode: 'user',
        }}
        className="absolute top-0 left-0 z-0 rounded-md border border-gray-600"
      />
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="absolute top-0 left-0 z-10 pointer-events-none"
      />
    </div>
  );
};

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([
    "👋 Hola, ¿en qué puedo ayudarte?",
    "💡 Puedes preguntarme sobre la cámara o cualquier otra cosa.",
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md h-[500px] bg-gray-900 shadow-xl rounded-xl p-6 border border-gray-700 text-white">
      <div className="text-lg font-semibold mb-4 text-white">🤖 Chat IA</div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[80%] text-sm ${
              idx % 2 === 0
                ? 'bg-gray-800 text-purple-300 self-start'
                : 'bg-purple-600 text-white self-end'
            }`}
          >
            {msg}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          placeholder="Escribí tu mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-full transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const [frase, setFrase] = useState<string>("");
  const [detections, setDetections] = useState<any[]>([]);

  useEffect(() => {
    socket_results.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFrase(data.conclusion);
        setDetections(data.detections);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket_results.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket_results.close();
    };
  }, []);

  return (
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center p-8">
      <main className="grid grid-cols-2 gap-12 w-full max-w-5xl">
        <div className="flex items-center justify-center">
          <ChatComponent />
        </div>
        <div className="flex flex-col justify-start items-center w-full h-full space-y-4">
          <WebcamComponent detections={detections} />
          <div
            key={frase}
            style={{
              color: 'white',
              fontSize: '14px',
              padding: '12px',
              borderRadius: '8px',
              width: '320px',
              minHeight: '48px',
              textAlign: 'center',
              backgroundColor: 'transparent',
              animation: 'fadeIn 0.5s ease-in-out'
            }}
          >
            {frase || "Connecting..."}
          </div>          
        </div>
      </main>
      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
