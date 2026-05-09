'use client';

import { useState, useEffect } from 'react';
import { ScanLine, Search, Package, Check, ArrowRight, Loader2, KeyRound, AlertCircle, Phone, List, QrCode } from 'lucide-react';
import { useParams } from 'next/navigation';
import QRScanner from '../../../components/QRScanner';
import { getBookingByCode, updateBookingStatus, getLocationBySlug, listenToActiveBookings } from '../../../lib/bookingService';

export default function PartnerDashboard() {
  const params = useParams();
  const slug = params.slug as string;

  const [location, setLocation] = useState<any | null>(null);
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  
  // Prihlasovanie & Relácia
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Stavy aplikácie
  const [activeTab, setActiveTab] = useState<'scan' | 'list'>('scan');
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializácia podniku a kontrola existujúceho prihlásenia
  useEffect(() => {
    async function init() {
      if (!slug) return;
      const result = await getLocationBySlug(slug);
      
      if (result.success && result.data) {
        setLocation(result.data);
        
        // Kontrola, či už je personál prihlásený z minula
        const savedAuth = localStorage.getItem(`auth_${slug}`);
        if (savedAuth) {
          const authData = JSON.parse(savedAuth); // OPRAVENÉ
          const timePassed = new Date().getTime() - authData.timestamp;
          const hours12 = 12 * 60 * 60 * 1000;

          // OPRAVENÉ (result.data as any).pin kvôli TypeScriptu
          if (timePassed < hours12 && authData.pin === (result.data as any).pin) {
            setIsAuthenticated(true);
          } else {
            // Relácia vypršala alebo sa zmenil PIN
            localStorage.removeItem(`auth_${slug}`);
          }
        }
      }
      setIsLoadingInit(false);
    }
    init();
  }, [slug]);

  // Nastavenie živého počúvania databázy (Live Updates)
  useEffect(() => {
    let unsubscribe: () => void;

    // Počúvame iba vtedy, ak je overený a podnik je načítaný
    if (isAuthenticated && location) {
      unsubscribe = listenToActiveBookings(location.id, (liveData) => {
        setActiveBookings(liveData);
      });
    }

    // Odpojenie poslucháča pri odchode zo stránky, aby sme nezaťažovali Firebase
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, location]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === location?.pin) {
      setIsAuthenticated(true);
      setLoginError('');
      // Uloženie úspešného prihlásenia s aktuálnym časom
      localStorage.setItem(`auth_${slug}`, JSON.stringify({
        pin: pinInput,
        timestamp: new Date().getTime()
      }));
    } else {
      setLoginError('Nesprávny PIN kód');
      setPinInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`auth_${slug}`);
    setIsAuthenticated(false);
    setPinInput('');
  };

  const handleSearch = async (code: string) => {
    if (code.length < 6) return;
    setIsLoading(true);
    const result = await getBookingByCode(code.toUpperCase());
    setIsLoading(false);

    if (result.success && result.data) {
      if ((result.data as any).locationId !== location.id) {
        alert("Pozor! Táto batožina je rezervovaná pre iný podnik.");
        return;
      }
      setBooking(result.data);
      setIsScanning(false);
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
        alert('Batožina bola úspešne prevzatá!');
        setBooking({ ...booking, status: 'STORED' });
      } else {
        alert('Batožina bola odovzdaná!');
        setBooking(null);
        setManualCode('');
      }
      // Netreba volať loadActiveBookings(), live poslucháč to urobí automaticky!
    }
  };

  if (isLoadingInit) return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>;
  if (!location) return <div className="min-h-[100dvh] flex items-center justify-center bg-red-50 p-6 text-center"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h1 className="text-2xl font-black text-black">Podnik nebol nájdený</h1></div>;

  if (!isAuthenticated) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 text-center">
          <KeyRound className="w-12 h-12 text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-black mb-2">{location.name}</h1>
          <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">Partnerský prístup</p>
          <form onSubmit={handleLogin}>
            <input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="••••••" className="w-full text-center text-4xl tracking-[0.5em] font-mono font-black py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl mb-4 outline-none focus:border-black" />
            {loginError && <p className="text-red-500 font-bold text-xs mb-4 uppercase">{loginError}</p>}
            <button type="submit" disabled={pinInput.length !== 6} className="w-full bg-black text-white font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl disabled:opacity-30">Vstúpiť</button>
          </form>
        </div>
      </main>
    );
  }

  if (isScanning) return <QRScanner onScanSuccess={handleSearch} onCancel={() => setIsScanning(false)} />;

  return (
    <main className="relative h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden font-sans text-black">
      
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-black tracking-tight">{location.name}</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Pripojené online
          </p>
        </div>
        <button onClick={handleLogout} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">Odhlásiť</button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {booking ? (
          <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-md mx-auto w-full">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl mb-6 border border-gray-100 mt-4">
              <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Kód rezervácie</p>
                  <h2 className="text-4xl font-black text-black tracking-tight font-mono">{booking.bookingId}</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                  booking.status === 'STORED' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {booking.status === 'PENDING' ? 'Na príchod' : 
                   booking.status === 'STORED' ? 'Uložené' : 'Ukončené'}
                </span>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Zákazník</span><span className="font-black text-lg">{booking.userName}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Kontakt</span>
                  {booking.userPhone ? (
                    <a href={`tel:${booking.userPhone}`} className="font-black text-blue-600 text-lg flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"><Phone className="w-4 h-4" /> Volať</a>
                  ) : (
                    <span className="font-bold text-gray-400">Neuvedený</span>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest block mb-3">Batožina ({booking.items?.length || 0} ks)</span>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.map((item: any, i: number) => (
                      <span key={i} className="bg-gray-50 border border-gray-200 text-black text-[10px] font-black px-3 py-2 rounded-xl flex items-center gap-2 uppercase tracking-wider"><Package className="w-3 h-3 text-gray-400" /> {item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {booking.status === 'COMPLETED' ? (
                <div className="w-full bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
                  <Check className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Rezervácia bola ukončená</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">Batožina už bola odovzdaná zákazníkovi.</p>
                </div>
              ) : (
                <button 
                  onClick={handleAction} disabled={isLoading}
                  className={`w-full font-black text-lg py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest ${booking.status === 'PENDING' ? 'bg-black text-white' : 'bg-green-600 text-white'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin w-7 h-7" /> : (booking.status === 'PENDING' ? <><Check className="w-7 h-7" /> Prevziať</> : <><ArrowRight className="w-7 h-7" /> Odovzdať</>)}
                </button>
              )}
              
              <button onClick={() => setBooking(null)} className="w-full mt-6 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-black">Zrušiť a späť</button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto w-full">
            {activeTab === 'scan' ? (
              <div className="animate-in fade-in duration-500">
                <button onClick={() => setIsScanning(true)} className="w-full bg-black text-white p-12 rounded-[2.5rem] shadow-2xl shadow-black/20 flex flex-col items-center justify-center gap-6 active:scale-95 transition-all mb-12">
                  <ScanLine className="w-20 h-20" />
                  <span className="text-2xl font-black uppercase tracking-widest">Skenovať QR</span>
                </button>
                <div className="flex items-center gap-4 mb-10"><div className="flex-1 h-px bg-gray-300"></div><span className="font-black uppercase tracking-[0.2em] text-[10px]">Ručný kód</span><div className="flex-1 h-px bg-gray-300"></div></div>
                <div className="bg-white p-2 rounded-[2rem] flex border-2 border-gray-200 focus-within:border-black transition-all shadow-sm">
                  <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Zadajte 6 znakov" className="flex-1 bg-transparent px-4 py-4 outline-none font-black text-xl tracking-[0.3em] text-black" maxLength={6} />
                  <button onClick={() => handleSearch(manualCode)} disabled={manualCode.length < 6 || isLoading} className="bg-black text-white px-6 rounded-[1.5rem] disabled:opacity-20 flex items-center justify-center">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <h3 className="text-xl font-black mb-6">Aktívne rezervácie</h3>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                    <Package className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">V úschovni nie sú žiadne batožiny</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map(b => (
                      <button key={b.id} onClick={() => setBooking(b)} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between active:scale-95 transition-all text-left">
                        <div>
                          <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest inline-block mb-2 ${b.status === 'PENDING' ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                            {b.status === 'PENDING' ? 'Na príchod' : 'V úschovni'}
                          </div>
                          <h4 className="font-black text-black">{b.userName}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">{b.items?.length || 0} kusy • {b.bookingId}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl"><ArrowRight className="w-5 h-5 text-gray-300" /></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SPODNÁ NAVIGÁCIA so živými číslami */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-8 flex gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => { setBooking(null); setActiveTab('scan'); }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'scan' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          <QrCode className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Skenovať</span>
        </button>
        <button 
          onClick={() => { setBooking(null); setActiveTab('list'); }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all ${activeTab === 'list' ? 'bg-black text-white shadow-lg shadow-black/20' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          <div className="relative">
            <List className="w-6 h-6" />
            {activeBookings.length > 0 && <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white animate-bounce'}`}>{activeBookings.length}</span>}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Aktívne</span>
        </button>
      </div>

    </main>
  );
}