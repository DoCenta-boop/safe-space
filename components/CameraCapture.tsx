'use client';
import { useState, useRef, useEffect } from 'react';
import { RotateCcw, Check } from 'lucide-react';

type Props = {
  title: string;
  onCapture: (imageString: string) => void;
  onCancel: () => void;
};

export default function CameraCapture({ title, onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Chyba kamery:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => { 
      // Oprava: Doplnený typ MediaStreamTrack pre track
      if (stream) {
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop()); 
      }
    };
  }, [stream]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL('image/jpeg', 0.8));
        // Oprava: Doplnený typ MediaStreamTrack pre track
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      }
    }
  };

  const retakePhoto = () => { 
    setImage(null); 
    startCamera(); 
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">{title}</h3>

      {!image ? (
        <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 shadow-inner">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button 
            onClick={takePhoto} 
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-95 shadow-xl z-10"
          >
            <div className="w-12 h-12 bg-black rounded-full" />
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <img src={image} alt="Náhľad" className="w-full aspect-[3/4] object-cover rounded-2xl mb-6 shadow-md" />
          <div className="flex gap-4 w-full">
            <button onClick={retakePhoto} className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95">
              <RotateCcw className="w-5 h-5" /> Znova
            </button>
            <button onClick={() => onCapture(image)} className="flex-1 py-4 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95">
              <Check className="w-5 h-5" /> Potvrdiť
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {!image && (
        <button onClick={onCancel} className="text-gray-500 font-medium mt-4 hover:text-black">
          Zrušiť fotenie
        </button>
      )}
    </div>
  );
}