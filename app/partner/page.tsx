'use client';

import { useState } from 'react';
import { ScanLine, Search, Package, Check, ArrowRight, Loader2 } from 'lucide-react';
import QRScanner from '../../components/QRScanner';
// Importujeme funkcie z našej databázovej služby
import { getBookingByCode, updateBookingStatus } from '../../lib/bookingService';

export default function PartnerDashboard() {
  const [view, setView] = useState<'idle' | 'scanning' | 'details'>('idle');
  const [manualCode, setManualCode] = useState('');
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // UPRAVENÉ: Hľadanie presne podľa zadaného kódu (bez PB-)
  const handleSearch = async (code: string) => {
    if (code.length < 6) return;
    
    setIsLoading(true);
    
    // Hľadáme kód presne tak, ako ho personál zadal (prevedený na veľké písmená)
    const result = await getBookingByCode(code.toUpperCase());
    
    setIsLoading(false);

    if (result.success) {
      setBooking(result.data);
      setView('details');
    } else {
      alert("Rezervácia s kódom " + code.toUpperCase() + " nebola nájdená.");
    }
  };

  const handleAction = async () => {
    if (!booking) return;
    
    setIsLoading(true);
    const newStatus = booking.status === 'PENDING' ? 'STORED' : 'COMPLETED';
    
    const result = await updateBookingStatus(booking.id, newStatus);
    
    setIsLoading(false);

    if (result.success) {
      if (newStatus === 'STORED') {
        alert('Batožina bola úspešne prevzatá a uložená!');
        setBooking({ ...booking, status: 'STORED' });
      } else {
        alert('Batožina bola odovzdaná zákazníkovi!');
        setView('idle');
        setBooking(null);
        setManualCode('');
      }
    } else {
      alert('Chyba pri aktualizácii stavu.');
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gray-100 flex flex-col p-6 font-sans text-black">
      
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Kaviareň Centrum</h1>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">Partnerský portál</p>
        </div>
        <div className="bg-black text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg">
          KC
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        
        {view === 'idle' && (
          <div className="animate-in fade-in flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <button 
              onClick={() => setView('scanning')}
              className="w-full bg-black text-white p-8 rounded-[2.5rem] shadow-2xl shadow-black/20 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform mb-10"
            >
              <ScanLine className="w-16 h-16" />
              <span className="text-2xl font-black uppercase tracking-widest">Skenovať QR</span>
            </button>

            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px] text-black">Alebo ručne</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <div className="bg-white p-2 rounded-3xl flex border-2 border-gray-200 focus-within:border-black transition-all shadow-sm">
              <input 
                type="text" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Zadajte 6 znakov"
                className="flex-1 bg-transparent px-4 py-4 outline-none font-black text-xl tracking-[0.3em] text-black placeholder:text-gray-400 placeholder:font-bold placeholder:tracking-normal placeholder:text-sm"
                maxLength={6}
              />
              <button 
                onClick={() => handleSearch(manualCode)}
                disabled={manualCode.length < 6 || isLoading}
                className="bg-black text-white px-6 rounded-2xl font-black disabled:opacity-20 flex items-center justify-center active:scale-95 transition-transform"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}

        {view === 'scanning' && (
          <QRScanner 
            onScanSuccess={(text) => handleSearch(text)} 
            onCancel={() => setView('idle')} 
          />
        )}

        {view === 'details' && booking && (
          <div className="animate-in slide-in-from-bottom-8 duration-300 flex-1 flex flex-col">
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-6 border border-gray-100">
              <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Kód rezervácie</p>
                  <h2 className="text-4xl font-black text-black tracking-tight">{booking.bookingId}</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {booking.status === 'PENDING' ? 'Príjem' : 'Uložené'}
                </span>
              </div>

              <div className="space-y-5 mb-8 text-black">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Zákazník</span>
                  <span className="font-black text-lg">{booking.userName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Batožina</span>
                  <span className="font-black text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" /> {booking.items?.length || 0} ks
                  </span>
                </div>
              </div>

              {/* Fotografie z databázy (ak existujú) */}
              {booking.images && booking.images.length > 0 && (
                <>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Fotografie pre kontrolu</p>
                  <div className="flex gap-4 overflow-x-auto pb-2 snap-x no-scrollbar">
                    {booking.images.map((img: string, i: number) => (
                      <img 
                        key={i} 
                        src={img} 
                        alt="Batožina" 
                        className="w-40 h-40 object-cover rounded-3xl shrink-0 snap-center border-4 border-gray-50 shadow-sm"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto pt-4 pb-6">
              <button 
                onClick={handleAction}
                disabled={isLoading}
                className={`w-full font-black text-lg py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform uppercase tracking-widest ${
                  booking.status === 'PENDING' ? 'bg-black text-white shadow-black/20' : 'bg-green-600 text-white shadow-green-600/20'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin w-7 h-7" /> : (
                  booking.status === 'PENDING' ? (
                    <><Check className="w-7 h-7" /> Prevziať</>
                  ) : (
                    <><ArrowRight className="w-7 h-7" /> Odovzdať</>
                  )
                )}
              </button>
              
              <button 
                onClick={() => setView('idle')}
                className="w-full mt-6 text-gray-400 font-black uppercase tracking-widest text-xs hover:text-black transition-colors"
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