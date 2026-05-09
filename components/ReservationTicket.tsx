'use client';

import { useRef, useState } from 'react';
import { Download, Share2, CheckCircle2, Loader2, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

type Props = {
  bookingId: string;
  userName: string;
  size: string;
  userEmail: string;
  userPhone: string;
  days: number;
};

export default function ReservationTicket({ bookingId, userName, size, userEmail, userPhone, days }: Props) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generovanie vysokokvalitného A4 PDF
  const generatePDF = async () => {
    if (!pdfRef.current) return null;
    
    try {
      // Dáme prehliadaču čas na načítanie všetkých fontov a SVG
      await new Promise(resolve => setTimeout(resolve, 500));

      const node = pdfRef.current;

      // Vygenerujeme fotku zo skrytej A4 šablóny vo vysokom rozlíšení
      const imgData = await toJpeg(node, {
        quality: 1.0,
        pixelRatio: 2, // 2x rozlíšenie pre absolútnu ostrosť textu a QR kódu
        backgroundColor: '#ffffff',
        width: 794,  // Presná šírka A4
        height: 1123 // Presná výška A4
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Vložíme obrázok na celú plochu A4 (210x297 mm)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      return pdf;
    } catch (error: any) {
      console.error("Chyba generovania:", error);
      alert("Nepodarilo sa vytvoriť dokument.");
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    const pdf = await generatePDF();
    if (pdf) {
      pdf.save(`SafeSpace-Rezervacia-${bookingId}.pdf`);
    }
    setIsGenerating(false);
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const pdf = await generatePDF();
      if (!pdf) throw new Error("Generovanie zlyhalo");

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `SafeSpace-Rezervacia-${bookingId}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Moja rezervácia Safe Space',
          text: `Ahoj, tu je môj lístok do Safe Space. Kód: ${bookingId}`,
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Moja rezervácia Safe Space',
          text: `Safe Space kód: ${bookingId}\nMeno: ${userName}\nBatožina: ${size}\nDni: ${days}`,
          url: window.location.origin
        });
      } else {
        alert("Vaše zariadenie nepodporuje priame zdieľanie.");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') console.error(error);
    }
    setIsGenerating(false);
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full flex flex-col items-center relative">
      
      {/* -------------------------------------------------------------
        SKRYTÁ A4 ŠABLÓNA PRE PDF GENERÁTOR (Vysoká kvalita, nezobrazuje sa na obrazovke) 
        -------------------------------------------------------------
      */}
      <div 
        ref={pdfRef} 
        className="absolute bg-white" 
        style={{ top: '-10000px', left: '-10000px', width: '794px', height: '1123px', padding: '60px', color: '#000' }}
      >
        <div className="border-b-4 border-black pb-6 mb-12 flex justify-between items-end">
          <h1 className="text-6xl font-black uppercase tracking-tight">Safe Space</h1>
          <p className="text-2xl font-bold text-gray-500 uppercase tracking-widest">Rezervačný lístok</p>
        </div>

        <div className="flex justify-between items-center mb-16">
          <div className="w-1/2">
            <p className="text-xl font-black text-gray-400 uppercase tracking-widest mb-4">Váš tajný kód</p>
            <h2 className="text-7xl font-black font-mono tracking-widest mb-4">{bookingId}</h2>
            <p className="text-lg font-bold text-gray-500">Tento kód a QR kód ukážte personálu pri odovzdaní aj vyzdvihnutí batožiny.</p>
          </div>
          <div className="bg-white p-6 border-4 border-black rounded-3xl">
            {/* Obrovský a superostrý QR Kód */}
            <QRCodeSVG value={bookingId} size={250} level="H" />
          </div>
        </div>

        <div className="w-full bg-gray-50 rounded-3xl p-10 border-2 border-gray-200">
          <h3 className="text-3xl font-black uppercase tracking-widest border-b-2 border-gray-200 pb-6 mb-8">Detaily rezervácie</h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">Zákazník</span>
              <span className="text-2xl font-black">{userName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">Telefón</span>
              <span className="text-2xl font-black">{userPhone || 'Neuvedený'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">E-mail</span>
              <span className="text-2xl font-black">{userEmail || 'Neuvedený'}</span>
            </div>
            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">Batožina</span>
              <span className="text-2xl font-black">{size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">Doba úschovy</span>
              <span className="text-2xl font-black">{days} {days === 1 ? 'deň' : days < 5 ? 'dni' : 'dní'}</span>
            </div>
            <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
              <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">Dátum vytvorenia</span>
              <span className="text-2xl font-black">{formatDate()}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-16 left-0 w-full text-center">
          <p className="text-gray-400 font-bold text-xl uppercase tracking-widest">Ďakujeme, že využívate sieť úschovní Safe Space.</p>
        </div>
      </div>


      {/* -------------------------------------------------------------
        VIZUÁLNY LÍSTOK NA OBRAZOVKE PRE ZÁKAZNÍKA (Mobilná verzia) 
        -------------------------------------------------------------
      */}
      <div className="bg-green-50 p-4 rounded-full mb-6 mt-4">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-3xl font-black text-black mb-2 text-center tracking-tight">Rezervácia hotová!</h2>
      <p className="text-gray-500 font-bold text-sm text-center mb-8">Uložte si lístok a ukážte ho pri príchode.</p>

      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>
        <div className="flex items-center gap-2 mb-8 mt-2">
          <Ticket className="w-6 h-6 text-black" />
          <span className="font-black tracking-widest uppercase text-xs">Safe Space</span>
        </div>

        <div className="flex justify-center mb-6 bg-white p-4 rounded-3xl border-2 border-dashed border-gray-100">
          <QRCodeSVG value={bookingId} size={150} level="H" />
        </div>

        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 text-center">Váš tajný kód</p>
        <h3 className="text-4xl font-black text-black tracking-tight font-mono mb-8 text-center">{bookingId}</h3>

        <div className="space-y-4 pt-6 border-t-2 border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Meno</span>
            <span className="font-black text-sm text-black text-right">{userName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Batožina</span>
            <span className="font-black text-sm text-black text-right">{size}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full px-2">
        <button onClick={handleDownload} disabled={isGenerating} className="flex-1 py-4 bg-gray-200 text-black font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Uložiť PDF</>}
        </button>
        <button onClick={handleShare} disabled={isGenerating} className="flex-1 py-4 bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/20">
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Share2 className="w-5 h-5" /> Zdieľať</>}
        </button>
      </div>
    </div>
  );
}