'use client';

import { useState } from 'react';
import { ScanLine, Search, Package, Check, ArrowRight } from 'lucide-react';
import QRScanner from '../../components/QRScanner';

// Simulácia dát z databázy
const MOCK_BOOKING = {
  id: 'PB-X7B9A2',
  customerName: 'Ján Novák',
  itemsCount: 2,
  status: 'PENDING', // PENDING = čaká na prinesenie, STORED = uložená v podniku
  images: [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1547941126-3d5322b218b0?auto=format&fit=crop&w=300&q=80'
  ]
};

export default function PartnerDashboard() {
  const [view, setView] = useState<'idle' | 'scanning' | 'details'>('idle');
  const [manualCode, setManualCode] = useState('');
  const [booking, setBooking] = useState<typeof MOCK_BOOKING | null>(null);

  // Zatiaľ namockované vyhľadávanie
  const handleSearch = (code: string) => {
    // Tu by sme sa neskôr pýtali Firebase, či existuje rezervácia s týmto kódom
    const formattedCode = code.startsWith('PB-') ? code : `PB-${code.toUpperCase()}`;
    
    // Fejkujeme načítanie
    setBooking({ ...MOCK_BOOKING, id: formattedCode });
    setView('details');
  };

  const handleAction = () => {
    if (!booking) return;
    
    if (booking.status === 'PENDING') {
      alert('Batožina bola úspešne prevzatá a uložená!');
      // Tu sa v budúcnosti updatne Firebase na status: 'STORED'
      setBooking({ ...booking, status: 'STORED' });
    } else {
      alert('Batožina bola odovzdaná zákazníkovi!');
      // Tu sa updatne Firebase na status: 'COMPLETED' a vrátime sa na úvod
      setView('idle');
      setBooking(null);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gray-100 flex flex-col p-6">
      
      {/* Hlavička */}
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Kaviareň Centrum</h1>
          <p className="text-gray-500 font-medium text-sm">Partnerský portál</p>
        </div>
        <div className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
          KC
        </div>
      </header>

      {/* OBSAH PODĽA STAVU */}
      <div className="flex-1 flex flex-col">
        
        {/* STAV 1: Úvodná obrazovka */}
        {view === 'idle' && (
          <div className="animate-in fade-in flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <button 
              onClick={() => setView('scanning')}
              className="w-full bg-black text-white p-8 rounded-[2rem] shadow-xl shadow-black/10 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform mb-8"
            >
              <ScanLine className="w-16 h-16" />
              <span className="text-2xl font-bold">Skenovať QR kód</span>
            </button>

            <div className="flex items-center gap-4 mb-8 opacity-50">
              <div className="flex-1 h-px bg-gray-400"></div>
              <span className="font-bold uppercase tracking-widest text-sm">Alebo ručne</span>
              <div className="flex-1 h-px bg-gray-400"></div>
            </div>

            <div className="bg-white p-2 rounded-2xl flex border-2 border-transparent focus-within:border-black transition-colors shadow-sm">
              <input 
                type="text" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Zadajte 6 znakov"
                className="flex-1 bg-transparent px-4 py-4 outline-none font-bold text-lg tracking-widest"
                maxLength={6}
              />
              <button 
                onClick={() => handleSearch(manualCode)}
                disabled={manualCode.length < 5}
                className="bg-gray-100 text-black px-6 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center active:bg-gray-200"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STAV 2: Skenovanie kamery */}
        {view === 'scanning' && (
          <QRScanner 
            onScanSuccess={(text) => handleSearch(text)} 
            onCancel={() => setView('idle')} 
          />
        )}

        {/* STAV 3: Detaily po načítaní kódu */}
        {view === 'details' && booking && (
          <div className="animate-in slide-in-from-bottom-8 duration-300 flex-1 flex flex-col">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Kód rezervácie</p>
                  <h2 className="text-3xl font-black text-gray-800">{booking.id}</h2>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {booking.status === 'PENDING' ? 'Príjem' : 'Výdaj'}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Zákazník:</span>
                  <span className="font-bold text-gray-800">{booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Počet batožín:</span>
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Package className="w-4 h-4" /> {booking.itemsCount} ks
                  </span>
                </div>
              </div>

              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Fotografie na overenie</p>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {booking.images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    alt="Batožina" 
                    className="w-32 h-32 object-cover rounded-2xl shrink-0 snap-center border border-gray-100"
                  />
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <button 
                onClick={handleAction}
                className={`w-full font-bold text-lg py-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                  booking.status === 'PENDING' ? 'bg-black text-white' : 'bg-green-500 text-white'
                }`}
              >
                {booking.status === 'PENDING' ? (
                  <><Check className="w-6 h-6" /> Potvrdiť prevzatie od zákazníka</>
                ) : (
                  <><ArrowRight className="w-6 h-6" /> Odovzdať zákazníkovi späť</>
                )}
              </button>
              
              <button 
                onClick={() => setView('idle')}
                className="w-full mt-4 text-gray-500 font-bold py-4 hover:text-black transition-colors"
              >
                Zrušiť a späť
              </button>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}