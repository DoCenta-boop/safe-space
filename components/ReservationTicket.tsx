'use client';

import { useRef, useState } from 'react';
import { Download, Share2, CheckCircle2, Loader2, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type Props = {
  bookingId: string;
  userName: string;
  size: string;
  userEmail: string;
};

export default function ReservationTicket({ bookingId, userName, size, userEmail }: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Funkcia na vygenerovanie PDF
  const generatePDF = async () => {
    if (!ticketRef.current) return null;
    
    try {
      // Zabezpečíme, že sa to správne vyrenderuje aj na mobile
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight);
      return pdf;
    } catch (error) {
      console.error("Chyba pri generovaní PDF:", error);
      alert("Nepodarilo sa vytvoriť PDF. Skúste to znova.");
      return null;
    }
  };

  // 1. Tlačidlo: STIAHNUŤ
  const handleDownload = async () => {
    setIsGenerating(true);
    const pdf = await generatePDF();
    if (pdf) {
      pdf.save(`SafeSpace-Rezervacia-${bookingId}.pdf`);
    }
    setIsGenerating(false);
  };

  // 2. Tlačidlo: ZDIEĽAŤ
  const handleShare = async () => {
    setIsGenerating(true);
    
    try {
      // Otestujeme podporu natívneho zdieľania
      if (navigator.share) {
        await navigator.share({
          title: 'Moja rezervácia batožiny',
          text: `Ahoj, tu je môj lístok do Safe Space. Kód rezervácie je: ${bookingId}`,
          url: window.location.origin
        });
      } else {
        alert("Vaše zariadenie nepodporuje priame zdieľanie.");
      }
    } catch (error) {
      console.log("Zdieľanie zrušené alebo zlyhalo.", error);
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-green-50 p-4 rounded-full mb-6 mt-4">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-3xl font-black text-black mb-2 text-center tracking-tight">Rezervácia hotová!</h2>
      <p className="text-gray-500 font-bold text-sm text-center mb-8">Ukážte tento lístok pri príchode.</p>

      {/* LÍSTOK, KTORÝ SA BUDE TLAČIŤ DO PDF */}
      <div 
        ref={ticketRef} 
        className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-xl border border-gray-200 relative overflow-hidden mb-8"
      >
        <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-black" />
            <span className="font-black tracking-widest uppercase text-xs">Safe Space</span>
          </div>
        </div>

        {/* VRÁTENÝ QR KÓD */}
        <div className="flex justify-center mb-6 bg-white p-4 rounded-3xl border-2 border-dashed border-gray-100">
          <QRCodeSVG value={bookingId} size={150} level="H" />
        </div>

        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 text-center">Kód vašej rezervácie</p>
        <h3 className="text-4xl font-black text-black tracking-tight font-mono mb-8 text-center">{bookingId}</h3>

        <div className="space-y-4 pt-6 border-t-2 border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Meno</span>
            <span className="font-black text-sm text-black">{userName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Batožina</span>
            <span className="font-black text-sm text-black">{size}</span>
          </div>
        </div>
      </div>

      {/* AKČNÉ TLAČIDLÁ */}
      <div className="flex gap-4 w-full">
        <button 
          onClick={handleDownload} 
          disabled={isGenerating}
          className="flex-1 py-4 bg-gray-200 text-black font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Uložiť PDF</>}
        </button>
        <button 
          onClick={handleShare} 
          disabled={isGenerating}
          className="flex-1 py-4 bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/20"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Share2 className="w-5 h-5" /> Zdieľať</>}
        </button>
      </div>
    </div>
  );
}