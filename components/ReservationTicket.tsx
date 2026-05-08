'use client';
import { CheckCircle2, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // Importujeme skutočný generátor

type Props = {
  bookingId: string;
  userName: string;
  size: string;
  userEmail: string;
};

export default function ReservationTicket({ bookingId, userName, size, userEmail }: Props) {
  return (
    <div className="w-full animate-in fade-in zoom-in duration-500">
      <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 p-8 shadow-sm flex flex-col items-center">
        <div className="bg-green-50 p-4 rounded-full mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-black text-center mb-1">Rezervácia pripravená</h2>
        <p className="text-gray-500 text-sm mb-8 text-center font-medium">Ukážte tento kód pri odovzdaní batožiny.</p>

        {/* GENERÁTOR QR KÓDU */}
        <div className="bg-white p-4 rounded-3xl border-2 border-gray-50 mb-8 shadow-inner">
          <QRCodeSVG 
            value={bookingId} 
            size={180}
            level={"H"}
            includeMargin={true}
          />
        </div>

        <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 mb-8 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">Váš unikátny kód</span>
          <span className="text-4xl font-black text-black tracking-widest font-mono">
            {bookingId}
          </span>
        </div>

        <div className="w-full space-y-4 mb-8">
          <div className="flex justify-between items-center px-2">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Meno</span>
            <span className="text-black font-black">{userName}</span>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Batožina</span>
            <span className="text-black font-black">{size}</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-transform gap-2">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-[10px] font-black text-gray-600 uppercase">Uložiť</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-transform gap-2">
            <Share2 className="w-5 h-5 text-gray-600" />
            <span className="text-[10px] font-black text-gray-600 uppercase">Zdieľať</span>
          </button>
        </div>
      </div>
    </div>
  );
}