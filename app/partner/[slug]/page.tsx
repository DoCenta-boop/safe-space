'use client';

import { useState, useEffect } from 'react';
import { ScanLine, Search, Package, Check, ArrowRight, Loader2, KeyRound, AlertCircle, Phone, List, QrCode, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import QRScanner from '../../../components/QRScanner';
import { getBookingByCode, updateBookingStatus, getLocationBySlug, listenToActiveBookings } from '../../../lib/bookingService';

const BookingTimer = ({ status, createdAt, storedAt, bookingDays }: { status: string, createdAt: any, storedAt?: any, bookingDays: number }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [statusStyle, setStatusStyle] = useState('text-gray-500 bg-gray-100');

  useEffect(() => {
    if (status === 'PENDING') {
      setStatusStyle('text-amber-700 bg-amber-50');
      return;
    }

    const startTimestamp = storedAt || createdAt;
    if (!startTimestamp) return;

    const days = bookingDays || 1;
    const startMs = startTimestamp.seconds * 1000;
    const totalDurationMs = days * 24 * 60 * 60 * 1000;
    const endMs = startMs + totalDurationMs;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = endMs - now;
      setTimeLeft(remaining);

      const ratio = remaining / totalDurationMs;
      
      if (remaining <= 0) {
        setStatusStyle('text-white bg-rose-500 animate-pulse');
      } else if (ratio > 0.66) {
        setStatusStyle('text-emerald-700 bg-emerald-50');
      } else if (ratio > 0.33) {
        setStatusStyle('text-amber-700 bg-amber-50');
      } else {
        setStatusStyle('text-rose-700 bg-rose-50');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, storedAt, createdAt, bookingDays]);

  if (status === 'PENDING') {
    return (
      <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 w-max transition-colors text-amber-700 bg-amber-50">
        <Clock className="w-3.5 h-3.5" /> Čaká na prevzatie
      </div>
    );
  }

  if (timeLeft === null) return null;

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Vypršalo';
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);

    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 w-max transition-colors ${statusStyle}`}>
      <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
    </div>
  );
};


export default function PartnerDashboard() {
  const params = useParams();
  const slug = params.slug as string;

  const [location, setLocation] = useState<any | null>(null);
  const [isLoadingInit, setIsLoadingInit] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'scan' | 'list'>('scan');
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (!slug) return;
      const result = await getLocationBySlug(slug);
      
      if (result.success && result.data) {
        setLocation(result.data);
        const savedAuth = localStorage.getItem(`auth_${slug}`);
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          const timePassed = new Date().getTime() - authData.timestamp;
          if (timePassed < (12 * 60 * 60 * 1000) && authData.pin === (result.data as any).pin) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(`auth_${slug}`);
          }
        }
      }
      setIsLoadingInit(false);
    }
    init();
  }, [slug]);

  useEffect(() => {
    let unsubscribe: () => void;
    if (isAuthenticated && location) {
      unsubscribe = listenToActiveBookings(location.id, (liveData) => { setActiveBookings(liveData); });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isAuthenticated, location]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === location?.pin) {
      setIsAuthenticated(true);
      setLoginError('');
      localStorage.setItem(`auth_${slug}`, JSON.stringify({ pin: pinInput, timestamp: new Date().getTime() }));
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
        setBooking({ ...booking, status: 'STORED', storedAt: { seconds: Math.floor(Date.now() / 1000) } });
      } else {
        alert('Batožina bola odovzdaná!');
        setBooking(null);
        setManualCode('');
      }
    }
  };

  if (isLoadingInit) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#F9FAFB]"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  if (!location) return <div className="min-h-[100dvh] flex items-center justify-center bg-rose-50 p-6 text-center"><div className="flex flex-col items-center"><AlertCircle className="w-12 h-12 text-rose-500 mb-4" /><h1 className="text-xl font-bold text-gray-900">Podnik nebol nájdený</h1></div></div>;

  if (!isAuthenticated) {
    return (
      <main className="min-h-[100dvh] bg-[#F9FAFB] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-sm bg-white p-8 sm:p-10 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center">
          <div className="mb-6 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">Docenta</span>
            <span className="text-2xl font-bold text-blue-600 tracking-tight ml-1.5">SPACES</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">{location.name}</h1>
          <p className="text-[12px] font-medium text-gray-400 mb-8 uppercase tracking-widest text-center">Partnerský prístup</p>
          
          <form onSubmit={handleLogin} className="w-full">
            <input 
              type="password" inputMode="numeric" maxLength={6} 
              value={pinInput} onChange={(e) => setPinInput(e.target.value)} 
              placeholder="••••••" 
              className="w-full text-center text-3xl tracking-[0.5em] font-mono font-medium py-4 bg-gray-50 border border-gray-200 rounded-2xl mb-4 outline-none focus:border-gray-900 focus:bg-white transition-colors" 
            />
            {loginError && <p className="text-rose-500 font-medium text-sm mb-4 text-center">{loginError}</p>}
            <button type="submit" disabled={pinInput.length !== 6} className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-30 disabled:active:scale-100 text-[15px]">
              Vstúpiť
            </button>
          </form>
        </div>
        <div className="absolute bottom-8 w-full text-center">
          <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">Powered by Docenta</p>
        </div>
      </main>
    );
  }

  if (isScanning) return <QRScanner onScanSuccess={handleSearch} onCancel={() => setIsScanning(false)} />;

  return (
    <main className="relative h-[100dvh] w-full bg-[#F9FAFB] flex flex-col overflow-hidden font-sans text-gray-900">
      
      {/* HLAVIČKA (Glassmorphism) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="mb-0.5 flex items-center">
            <span className="text-lg font-bold text-gray-900 tracking-tight">Docenta</span>
            <span className="text-lg font-bold text-blue-600 tracking-tight ml-1">SPACES</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-semibold text-gray-600">{location.name}</h1>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-400 font-medium text-[11px] uppercase tracking-widest hover:text-gray-900 transition-colors">Odhlásiť</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 flex flex-col">
        {booking ? (
          <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100">
              
              <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-6">
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Kód rezervácie</p>
                  <h2 className="text-3xl font-bold text-gray-900 font-mono tracking-wider">{booking.bookingId}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                  booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 
                  booking.status === 'STORED' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {booking.status === 'PENDING' ? 'Očakávané' : booking.status === 'STORED' ? 'Uložené' : 'Ukončené'}
                </span>
              </div>
              
              <div className="space-y-4 mb-8 text-[15px]">
                <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Zákazník</span><span className="font-semibold">{booking.userName}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400 font-medium">Kontakt</span>
                  {booking.userPhone ? (
                    <a href={`tel:${booking.userPhone}`} className="font-semibold text-blue-600 flex items-center gap-1.5"><Phone className="w-4 h-4" /> Volať</a>
                  ) : (<span className="font-medium text-gray-400">Neuvedený</span>)}
                </div>
                
                {/* OPRAVA CHYBY: SPRÁVNY PRÍSTUP K PREMENNEJ bookingDays */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Doba úschovy</span>
                  <span className="font-semibold">
                    {booking.bookingDays || 1} {(booking.bookingDays || 1) === 1 ? 'deň' : (booking.bookingDays || 1) < 5 ? 'dni' : 'dní'}
                  </span>
                </div>
                
                {booking.status !== 'COMPLETED' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Časovač</span>
                    <BookingTimer status={booking.status} createdAt={booking.createdAt} storedAt={booking.storedAt} bookingDays={booking.bookingDays || 1} />
                  </div>
                )}

                <div className="pt-4 border-t border-gray-50">
                  <span className="text-gray-400 font-medium text-[13px] block mb-3">Batožina ({booking.items?.length || 0} ks)</span>
                  <div className="flex flex-wrap gap-2">
                    {booking.items?.map((item: any, i: number) => (
                      <span key={i} className="bg-gray-50 border border-gray-100 text-gray-700 text-[12px] font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400" /> {item.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {booking.status === 'COMPLETED' ? (
                <div className="w-full bg-gray-50 border border-gray-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Check className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-gray-900 font-semibold text-[15px]">Rezervácia bola ukončená</p>
                  <p className="text-[13px] text-gray-500 mt-1 font-medium">Batožina už bola odovzdaná zákazníkovi.</p>
                </div>
              ) : (
                <button 
                  onClick={handleAction} disabled={isLoading}
                  className={`w-full font-semibold text-[16px] py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${booking.status === 'PENDING' ? 'bg-gray-900 text-white' : 'bg-blue-600 text-white'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : (booking.status === 'PENDING' ? <><Check className="w-5 h-5" /> Prevziať batožinu</> : <><ArrowRight className="w-5 h-5" /> Odovzdať zákazníkovi</>)}
                </button>
              )}
              
              <button onClick={() => setBooking(null)} className="w-full mt-4 text-gray-400 font-medium text-[13px] hover:text-gray-900 py-2">Späť na prehľad</button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto w-full">
            {activeTab === 'scan' ? (
              <div className="animate-in fade-in duration-300">
                <button onClick={() => setIsScanning(true)} className="w-full bg-gray-900 text-white py-14 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-transform mb-10">
                  <ScanLine className="w-16 h-16 opacity-90" />
                  <span className="text-xl font-semibold tracking-wide">Skenovať QR kód</span>
                </button>
                <div className="flex items-center gap-4 mb-8"><div className="flex-1 h-[1px] bg-gray-200"></div><span className="font-medium text-gray-400 text-[12px] uppercase tracking-widest">Alebo zadajte kód</span><div className="flex-1 h-[1px] bg-gray-200"></div></div>
                <div className="bg-white p-1.5 rounded-2xl flex border border-gray-200 focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-50 transition-all shadow-sm">
                  <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Zadajte 6 znakov" className="flex-1 bg-transparent px-4 outline-none font-mono font-bold text-xl tracking-[0.2em] text-gray-900" maxLength={6} />
                  <button onClick={() => handleSearch(manualCode)} disabled={manualCode.length < 6 || isLoading} className="bg-gray-900 text-white px-5 py-3 rounded-xl disabled:opacity-20 flex items-center justify-center">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Aktívne rezervácie</h3>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 flex flex-col items-center">
                    <Package className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium text-[14px]">Zatiaľ tu nie sú žiadne batožiny.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings.map(b => (
                      <button key={b.id} onClick={() => setBooking(b)} className="w-full bg-white p-5 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col active:scale-[0.98] transition-transform text-left">
                        <div className="flex justify-between items-start w-full mb-3">
                          <div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-block mb-2 ${b.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                              {b.status === 'PENDING' ? 'Očakávané' : 'V úschovni'}
                            </div>
                            <h4 className="font-semibold text-gray-900 text-[15px]">{b.userName}</h4>
                            <p className="text-[12px] font-medium text-gray-400 tracking-wide mt-0.5">{b.items?.length || 0} kusy • {b.bookingId}</p>
                          </div>
                          <div className="bg-gray-50 p-2.5 rounded-full text-gray-400"><ArrowRight className="w-4 h-4" /></div>
                        </div>
                        <div className="pt-3 border-t border-gray-50 w-full flex justify-between items-center">
                          <span className="text-[11px] font-medium text-gray-400">Zostávajúci čas</span>
                          <BookingTimer status={b.status} createdAt={b.createdAt} storedAt={b.storedAt} bookingDays={b.bookingDays || 1} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SPODNÁ NAVIGÁCIA (NATIVE APP STYLE) */}
      <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 pb-8 pt-3 px-6 flex justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => { setBooking(null); setActiveTab('scan'); }} 
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-colors ${activeTab === 'scan' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <QrCode className={`w-6 h-6 ${activeTab === 'scan' ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[11px] font-medium">Skenovať</span>
        </button>
        <button 
          onClick={() => { setBooking(null); setActiveTab('list'); }} 
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-colors relative ${activeTab === 'list' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
        >
          <div className="relative">
            <List className={`w-6 h-6 ${activeTab === 'list' ? 'stroke-[2.5px]' : ''}`} />
            {activeBookings.length > 0 && <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full border-2 border-white bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white">{activeBookings.length}</span>}
          </div>
          <span className="text-[11px] font-medium">Zoznam</span>
        </button>
      </div>

    </main>
  );
}