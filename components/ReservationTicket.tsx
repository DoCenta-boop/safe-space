'use client';

import { useRef, useState } from 'react';
import { Download, Share2, CheckCircle2, Loader2, Ticket } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
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

  const generatePDF = async () => {
    if (!pdfRef.current) return null;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const node = pdfRef.current;

      const imgData = await toJpeg(node, {
        quality: 1.0,
        pixelRatio: 2, 
        backgroundColor: '#ffffff',
        width: 794,  
        height: 1123 
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      return pdf;
    } catch (error: any) {
      console.error("Chyba generovania PDF:", error);
      alert("Nepodarilo sa vytvoriť dokument. Skúste to prosím znova.");
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
          title: 'Moja rezervácia Docenta SPACES',
          text: `Ahoj, tu je môj lístok do Docenta SPACES. Kód: ${bookingId}`,
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Moja rezervácia Docenta SPACES',
          text: `Docenta SPACES kód: ${bookingId}\nMeno: ${userName}\nBatožina: ${size}\nDni: ${days}`,
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
        SKRYTÁ A4 ŠABLÓNA PRE PDF GENERÁTOR (Vysoko elegantný a čistý dizajn)
        -------------------------------------------------------------
      */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', top: 0, left: 0, pointerEvents: 'none' }}>
        <div 
          ref={pdfRef} 
          className="bg-white" 
          style={{ width: '794px', height: '1123px', padding: '70px', color: '#000' }}
        >
          {/* Hlavička */}
          <div className="border-b border-gray-200 pb-8 mb-12 flex justify-between items-end">
            <div className="flex items-center">
              <span className="text-4xl font-black text-[#0f172a] tracking-tighter">Docenta</span>
              <span className="text-4xl font-black text-blue-600 tracking-tighter ml-1.5">SPACES</span>
            </div>
            <p className="text-base font-bold text-gray-400 uppercase tracking-[0.15em]">Rezervačný lístok</p>
          </div>

          {/* QR kód a ID */}
          <div className="flex justify-between items-center mb-16">
            <div className="w-1/2">
              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Váš tajný kód</p>
              <h2 className="text-6xl font-black font-mono tracking-widest text-black mb-4">{bookingId}</h2>
              <p className="text-base font-medium text-gray-500 leading-relaxed max-w-sm">Tento kód a QR kód ukážte personálu pri odovzdaní aj vyzdvihnutí batožiny.</p>
            </div>
            <div className="bg-white p-4 border border-gray-100 rounded-3xl shadow-sm">
              <QRCodeCanvas value={bookingId} size={200} level="H" />
            </div>
          </div>

          {/* Tabuľka detailov */}
          <div className="w-full bg-gray-50 rounded-3xl p-10 border border-gray-100">
            <h3 className="text-lg font-black uppercase tracking-[0.15em] border-b border-gray-200 pb-4 mb-6 text-black">Detaily rezervácie</h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Zákazník</span>
                <span className="text-xl font-black text-black">{userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Telefón</span>
                <span className="text-xl font-black text-black">{userPhone || 'Neuvedený'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">E-mail</span>
                <span className="text-xl font-black text-black">{userEmail || 'Neuvedený'}</span>
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-gray-200">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Batožina</span>
                <span className="text-xl font-black text-black">{size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Doba úschovy</span>
                <span className="text-xl font-black text-black">{days} {days === 1 ? 'deň' : days < 5 ? 'dni' : 'dní'}</span>
              </div>
              <div className="flex justify-between items-center pt-5 border-t border-gray-200">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Dátum vytvorenia</span>
                <span className="text-xl font-black text-black">{formatDate()}</span>
              </div>
            </div>
          </div>

          {/* Pätička dokumentu */}
          <div className="absolute bottom-12 left-0 w-full text-center">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Ďakujeme, že využívate sieť úschovní Docenta SPACES.</p>
          </div>
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
          <span className="font-black tracking-widest uppercase text-xs">Docenta SPACES</span>
        </div>

        <div className="flex justify-center mb-6 bg-white p-4 rounded-3xl border-2 border-dashed border-gray-100">
          <QRCodeCanvas value={bookingId} size={150} level="H" />
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