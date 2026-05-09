'use client';
import { useState, useRef, useEffect } from 'react';
import { RotateCcw, Check, AlertCircle, Camera } from 'lucide-react';

type Props = {
  title: string;
  onCapture: (imageString: string) => void;
  onCancel: () => void;
};

export default function CameraCapture({ title, onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Funkcia na bezpečné vypnutie kamery
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Funkcia na vyžiadanie prístupu a zapnutie živého streamu
  const startCamera = async () => {
    setCameraError(null);
    setImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Váš prehliadač nepodporuje prístup ku kamere.');
      return;
    }

    try {
      // Žiadame o zadnú kameru (environment)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Chyba kamery:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Prístup bol zamietnutý. Prosím, povoľte kameru vo vyskakovacom okne alebo v nastaveniach prehliadača.');
      } else {
        setCameraError(`Kamera nie je dostupná: ${err.message || 'Neznáma chyba'}`);
      }
    }
  };

  // Zapneme kameru automaticky pri zobrazení komponentu
  useEffect(() => {
    startCamera();
    
    // Keď komponent zmizne (napr. po potvrdení fotky), vypneme ju
    return () => {
      stopCamera();
    };
  }, []);

  // Zachytenie snímku zo živého videa
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Nastavíme plátno na reálne rozlíšenie videa
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Vykreslíme aktuálny frame z videa na plátno
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Získame hotový obrázok
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        
        // Vypneme živý stream, kým sa používateľ rozhoduje
        stopCamera();
      }
    }
  };

  // Ak sa fotka nepáči, znova zapneme živý stream
  const retakePhoto = () => { 
    startCamera(); 
  };

  // Definitívne potvrdenie fotky a posun ďalej
  const handleConfirm = () => {
    if (image) {
      onCapture(image);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">{title}</h3>

      {!image ? (
        <div className="w-full flex flex-col items-center">
          {cameraError ? (
            // Stav: Nastala chyba (napr. používateľ zamietol prístup)
            <div className="w-full aspect-[3/4] bg-red-50 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-red-200 mb-6">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-700 font-bold mb-4 text-sm leading-relaxed">{cameraError}</p>
              <button onClick={startCamera} className="py-3 px-6 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-transform flex items-center gap-2">
                <Camera className="w-4 h-4" /> Skúsiť znova
              </button>
            </div>
          ) : (
            // Stav: Živý obraz a čakanie na stlačenie spúšte
            <div className="relative w-full aspect-[3/4] bg-black rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-black/10">
              {/* playsInline a muted sú dôležité na to, aby iOS nezapol video na celú obrazovku */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              <button 
                onClick={takePhoto} 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full border-[6px] border-white flex items-center justify-center active:scale-90 transition-all shadow-xl z-10"
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-inner" />
              </button>
            </div>
          )}
        </div>
      ) : (
        // Stav: Fotka je odfotená, čakáme na potvrdenie
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <img src={image} alt="Náhľad batožiny" className="w-full aspect-[3/4] object-cover rounded-[2rem] mb-6 shadow-xl shadow-black/10" />
          <div className="flex gap-4 w-full">
            <button onClick={retakePhoto} className="flex-1 py-5 bg-gray-100 text-gray-600 hover:text-black font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <RotateCcw className="w-5 h-5" /> Znova
            </button>
            <button onClick={handleConfirm} className="flex-1 py-5 bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/20">
              <Check className="w-5 h-5" /> Potvrdiť
            </button>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Tlačidlo pre krok späť (ukazuje sa len, ak nie je odfotená fotka) */}
      {!image && (
        <button onClick={() => { stopCamera(); onCancel(); }} className="text-gray-400 font-black uppercase text-[10px] tracking-widest mt-2 hover:text-black transition-colors p-4">
          Zrušiť fotenie
        </button>
      )}
    </div>
  );
}