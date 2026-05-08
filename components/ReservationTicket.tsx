'use client';
import { CheckCircle2, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  bookingId: string;
  userName: string;
  size: string;
  userEmail: string;
};

export default function ReservationTicket({ bookingId, userName, size, userEmail }: Props) {
  return (
    <div className="w-full animate-in fade-in zoom-in duration-500 font-sans">
      <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm flex flex-col items-center">
        {/* Potvrdenie ikona */}
        <div className="bg-green-50 p-4 rounded-full mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        
        <h2 className="text-2xl font-black text-black text-center mb-1">Rezervácia pripravená</h2>
        <p className="text-gray-500 text-sm mb-8 text-center font-medium">Ukážte tento kód pri odovzdaní batožiny.</p>

        {/* SKUTOČNÝ QR KÓD */}
        <div className="bg-white p-4 rounded-[2rem] border-2 border-gray-50 mb-8 shadow-inner">
          <QRCodeSVG 
            value={bookingId} 
            size={180}
            level={"H"}
            includeMargin={true}
          />
        </div>

        {/* 6-MIESTNY KÓD - MAXIMÁLNA ČITATEĽNOSŤ */}
        <div className="w-full bg-black rounded-3xl p-6 mb-8 flex flex-col items-center shadow-lg shadow-black/10">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Váš kód pre podnik</span>
          <span className="text-4xl font-black text-white tracking-[0.2em] font-mono">
            {bookingId}
          </span>
        </div>

        {/* DETAILY */}
        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between items-center px-2">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Meno</span>
            <span className="text-black font-black text-lg">{userName}</span>
          </div>
          <div className="flex justify-between items-center px-2 border-t border-gray-50 pt-4">
            <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Batožina</span>
            <span className="text-black font-black text-lg">{size}</span>
          </div>
        </div>

        {/* AKCIE */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-transform gap-2">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Uložiť</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-transform gap-2">
            <Share2 className="w-5 h-5 text-gray-600" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Zdieľať</span>
          </button>
        </div>
      </div>
    </div>
  );
}