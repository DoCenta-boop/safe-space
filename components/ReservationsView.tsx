'use client';
import { MapPin, Clock, Plus, Ticket } from 'lucide-react';

export default function ReservationsView() {
  return (
    <div className="w-full h-full bg-gray-50 p-6 overflow-y-auto pb-32 animate-in fade-in duration-300">
      <h2 className="text-3xl font-black mb-6 text-gray-800 tracking-tight">Moje batožiny</h2>

      {/* AKTÍVNA REZERVÁCIA (ČAKAJÚCA NA ODOVZDANIE) */}
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Aktuálne rezervácie</h3>
      
      <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-8 border border-gray-100 relative overflow-hidden">
        {/* Progress Bar (napr. vizuál ubiehajúceho času z 4 hodín) */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
          <div className="h-full bg-orange-400 w-[20%] rounded-r-full"></div>
        </div>

        <div className="mt-2 flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-xl text-gray-800">Kaviareň Centrum</h4>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> Hlavné námestie 4
            </p>
          </div>
          <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider text-center leading-tight">
            Čaká na<br/>odovzdanie
          </span>
        </div>

        {/* UPOZORNENIE NA 4 HODINY */}
        <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mb-6 w-full flex items-start gap-3 shadow-sm">
          <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-orange-800 leading-relaxed">
            Miesto je rezervované. Batožinu prosím <span className="font-black text-orange-900">odovzdajte do 4 hodín</span>, inak sa rezervácia automaticky zruší.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <Clock className="w-6 h-6 text-black" />
          </div>
          <div>
            {/* Zapracovaná informácia o čase na odovzdanie */}
            <p className="text-sm text-gray-500 font-medium">Zostáva času na príchod • <span className="font-bold text-blue-600">Sadzba 24h</span></p>
            <p className="font-black text-xl text-gray-800">3h 45m</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-gray-100 text-gray-800 font-bold py-4 rounded-2xl active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50">
            <Plus className="w-5 h-5" /> Predĺžiť
          </button>
          <button className="flex-1 bg-black text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform flex justify-center items-center gap-2 shadow-lg shadow-black/20">
            <Ticket className="w-5 h-5" /> Lístok
          </button>
        </div>
      </div>

      {/* HISTÓRIA */}
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">História</h3>
      <div className="space-y-4">
        
        {/* Minulá rezervácia 1 */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex justify-between items-center opacity-70">
          <div>
            <h4 className="font-bold text-gray-800">Hlavná stanica - Boxy</h4>
            <p className="text-sm text-gray-500 mt-0.5">12. mája 2026 • 2 ks • Sadzba 24h</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800">6.00 €</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Ukončená</p>
          </div>
        </div>

        {/* Minulá rezervácia 2 */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 flex justify-between items-center opacity-70">
          <div>
            <h4 className="font-bold text-gray-800">Hotel Bratislava</h4>
            <p className="text-sm text-gray-500 mt-0.5">5. apríla 2026 • 1 ks • Sadzba 24h</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800">2.00 €</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Ukončená</p>
          </div>
        </div>

      </div>
    </div>
  );
}