'use client';
import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';

type Props = {
  onScanSuccess: (decodedText: string) => void;
  onCancel: () => void;
};

export default function QRScanner({ onScanSuccess, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Vyžiadame si zadnú kameru (rovnako ako pri zákazníkovi)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Pre iOS je kľúčové mať playsInline
          videoRef.current.setAttribute("playsinline", "true"); 
          videoRef.current.play();
          
          // Akonáhle video beží, spustíme skenovaciu slučku
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Chyba kamery:", err);
      }
    };

    // Táto funkcia beží neustále a hľadá QR kód v aktuálnom obraze
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvasElement = canvasRef.current;
        
        if (canvasElement) {
          const canvas = canvasElement.getContext("2d", { willReadFrequently: true });
          canvasElement.height = video.videoHeight;
          canvasElement.width = video.videoWidth;
          
          if (canvas) {
            // Nakreslíme aktuálny snímok z videa na skrytý canvas
            canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            
            // Pošleme snímok do jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            // Ak nájde kód, zastavíme slučku a vrátime výsledok
            if (code) {
              onScanSuccess(code.data);
              return; 
            }
          }
        }
      }
      // Ak kód nenašiel, pokračujeme na ďalší snímok
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    // Upratovanie pri odchode z obrazovky (zastavenie kamery)
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">Namierte kameru na lístok</h3>

      {/* Identický dizajn s CameraCapture.tsx */}
      <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 shadow-inner">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Vizuálny zameriavací rámik (jemne priehľadný) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-white/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"></div>
        </div>
      </div>

      {/* Skrytý canvas pre spracovanie obrazu na pozadí */}
      <canvas ref={canvasRef} className="hidden" />

      <button onClick={onCancel} className="text-gray-500 font-medium hover:text-black">
        Zrušiť skenovanie
      </button>
    </div>
  );
}