'use client';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle2, Calendar, Map, Wallet, Mail } from 'lucide-react';

type Props = {
  bookingId: string;
  userName: string;
  size: string;
  userEmail: string;
};

export default function ReservationTicket({ bookingId, userName, size, userEmail }: Props) {
  const pinCode = bookingId.replace('PB-', '');

  return (
    <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500 pb-8">
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 w-full flex flex-col items-center shadow-sm">
        <div className="bg-green-100 text-green-600 p-3 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-1">Rezervácia potvrdená!</h2>
        <p className="text-gray-500 text-center text-sm mb-6 flex items-center justify-center gap-1">
          <Mail className="w-4 h-4" /> Kópia bola odoslaná na {userEmail}
        </p>
        
        {/* QR KÓD A ZÁLOŽNÝ PIN */}
        <div className="bg-white p-6 border-2 border-gray-100 rounded-2xl mb-6 mt-2 flex flex-col items-center w-full shadow-sm">
          <QRCodeSVG value={bookingId} size={180} />
          
          <div className="mt-6 text-center w-full pt-4 border-t-2 border-dashed border-gray-100">
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Záložný kód</span>
            <span className="text-4xl font-black tracking-[0.2em] text-gray-800">{pinCode}</span>
          </div>
        </div>

        <div className="w-full space-y-3 border-t pt-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Zákazník:</span>
            <span className="font-bold">{userName.split(' ')[0]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Batožina:</span>
            <span className="font-bold uppercase">{size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Miesto:</span>
            <span className="font-bold text-right">Kaviareň Centrum</span>
          </div>
        </div>
      </div>

      {/* TLAČIDLÁ PRE OFFLINE PRÍSTUP A NAVIGÁCIU */}
      <div className="w-full mt-4 space-y-3">
        <button className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-black/20">
          <Wallet className="w-5 h-5" />
          Pridať do Apple / Google Wallet
        </button>
        
        <div className="flex gap-3 w-full">
          <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
            <Calendar className="w-5 h-5" />
            Kalendár
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
            <Map className="w-5 h-5" />
            Navigovať
          </button>
        </div>

        <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 text-gray-500 font-bold py-3 active:scale-95 transition-transform mt-2">
          <Download className="w-5 h-5" />
          Stiahnuť ako PDF / Snímka
        </button>
      </div>
    </div>
  );
}