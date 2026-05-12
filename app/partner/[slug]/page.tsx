'use client';

import { useState, useEffect } from 'react';
import { ScanLine, Search, Package, Check, ArrowRight, Loader2, KeyRound, AlertCircle, Phone, List, QrCode, Clock, Eye, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import QRScanner from '../../../components/QRScanner';
import { getBookingByCode, updateBookingStatus, getLocationBySlug, listenToActiveBookings } from '../../../lib/bookingService';

// Komponent časovača zostáva rovnaký...
const BookingTimer = ({ status, createdAt, storedAt, bookingDays }: { status: string, createdAt: any, storedAt?: any, bookingDays: number }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [statusStyle, setStatusStyle] = useState('text-gray-500 bg-gray-100 border-gray-200');

  useEffect(() => {
    if (status === 'PENDING') {
      setStatusStyle('text-orange-700 bg-orange-100 border-orange-200');
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
        setStatusStyle('text-white bg-red-600 border-red-700 animate-pulse shadow-lg shadow-red-500/30');
      } else if (ratio > 0.66) {
        setStatusStyle('text-green-700 bg-green-100 border-green-200');
      } else if (ratio > 0.33) {
        setStatusStyle('text-orange-700 bg-orange-100 border-orange-200');
      } else {
        setStatusStyle('text-red-700 bg-red-100 border-red-200');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, storedAt, createdAt, bookingDays]);

  if (status === 'PENDING') return <div className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 w-max text-orange-700 bg-orange-100 border-orange-200"><Clock className="w-3 h-3" /> Čaká na prevzatie</div>;
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
  return <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 w-max ${statusStyle}`}><Clock className="w-3 h-3" /> {formatTime(timeLeft)}</div>;
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
  
  // NOVÉ: Stav pre zväčšenú fotku
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

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
      localStorage.setItem(`auth_${slug}`, JSON.stringify({ pin: pinInput, timestamp: new Date().getTime() }));
    } else {
      setLoginError('Nesprávny PIN kód');
      setPinInput('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`auth_${slug}`);
    setIsAuthenticated(false);
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
      alert(newStatus === 'STORED' ? 'Batožina prevzatá!' : 'Batožina odovzdaná!');
      setBooking(newStatus === 'STORED' ? { ...booking, status: 'STORED', storedAt: { seconds: Math.floor(Date.now() / 1000) } } : null);
      if (newStatus === 'COMPLETED') setManualCode('');
    }
  };

  if (isLoadingInit) return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>;
  if (!location) return <div className="min-h-[100dvh] flex items-center justify-center bg-red-50 p-6 text-center"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h1 className="text-2xl font-black text-black">Podnik nebol nájdený</h1></div>;

  if (!isAuthenticated) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white p-8 rounded-[2rem] shadow-xl border-2 border-gray-100 text-center flex flex-col items-center">
          <div className="mb-8 flex items-center"><span className="text-3xl font-black text-[#0f172a] tracking-tighter">Docenta</span><span className="text-3xl font-black text-blue-600 tracking-tighter ml-1.5">SPACES</span></div>
          <h1 className="text-xl font-black text-black mb-1">{location.name}</h1>
          <p className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">Partnerský prístup</p>
          <form onSubmit={handleLogin} className="w-full">
            <input type="password" inputMode="numeric" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="••••••" className="w-full text-center text-4xl tracking-[0.5em] font-mono font-black py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl mb-4 outline-none focus:border-black" />
            {loginError && <p className="text-red-500 font-bold text-xs mb-4 uppercase">{loginError}</p>}
            <button type="submit" disabled={pinInput.length !== 6} className="w-full bg-black text-white font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-30">Vstúpiť</button>
          </form>
        </div>
      </main>
    );
  }

  if (isScanning) return <QRScanner onScanSuccess={handleSearch} onCancel={() => setIsScanning(false)} />;

  return (
    <main className="relative h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden font-sans text-black">
      
      {/* MODAL PRE FULLSCREEN FOTKU */}
      {fullscreenImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <button onClick={() => setFullscreenImg(null)} className="absolute top-6 right-6 bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img src={fullscreenImg} alt="Detail batožiny" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          <p className="text-white font-black uppercase text-[10px] tracking-widest mt-6 bg-white/10 px-4 py-2 rounded-full">Detailný záber batožiny</p>
        </div>
      )}

      <header className="p-5 bg-white border-b-2 border-gray-100 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center"><span className="text-xl font-black text-[#0f172a] tracking-tighter">Docenta</span><span className="text-xl font-black text-blue-600 tracking-tighter ml-1">SPACES</span></div>
          <h1 className="text-lg font-black text-black tracking-tight leading-none mt-1">{location.name}</h1>
        </div>
        <button onClick={handleLogout} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500">Odhlásiť</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 flex flex-col items-center">
        {booking ? (
          <div className="animate-in slide-in-from-bottom-8 duration-300 w-full max-w-md">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border-2 border-gray-100">
              
              <div className="flex justify-between items-start mb-6 border-b-2 border-gray-100 pb-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Rezervácia</p>
                  <h2 className="text-3xl font-black text-black tracking-tight font-mono">{booking.bookingId}</h2>
                </div>
                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  booking.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 
                  booking.status === 'STORED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {booking.status === 'PENDING' ? 'Na príchod' : booking.status === 'STORED' ? 'Uložené' : 'Ukončené'}
                </span>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Zákazník</span><span className="font-black text-base">{booking.userName}</span></div>
                <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Kontakt</span>
                  {booking.userPhone ? <a href={`tel:${booking.userPhone}`} className="font-black text-blue-600 text-xs flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100"><Phone className="w-3.5 h-3.5" /> Volať</a> : <span className="font-bold text-gray-400">Neuvedený</span>}
                </div>
                {booking.status !== 'COMPLETED' && (
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Zostávajúci čas</span><BookingTimer status={booking.status} createdAt={booking.createdAt} storedAt={booking.storedAt} bookingDays={booking.bookingDays || 1} /></div>
                )}

                {/* --- SEKICA FOTIEK PRE PERSONÁL --- */}
                <div className="pt-6 border-t-2 border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Fotodokumentácia</span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded-md">{booking.images?.length || 0} FOTKY</span>
                  </div>
                  
                  {booking.images && booking.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {booking.images.map((img: any, i: number) => (
                        <div key={i} className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border-2 border-gray-100 cursor-pointer" onClick={() => setFullscreenImg(img.image || img)}>
                          <img src={img.image || img} alt="Batožina" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-2xl text-center">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Bez fotografií</p>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleAction} disabled={isLoading} className={`w-full font-black text-lg py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform uppercase tracking-widest ${booking.status === 'PENDING' ? 'bg-black text-white' : 'bg-blue-600 text-white'}`}>
                {isLoading ? <Loader2 className="animate-spin w-7 h-7" /> : (booking.status === 'PENDING' ? <><Check className="w-6 h-6" /> Prevziať</> : <><ArrowRight className="w-6 h-6" /> Odovzdať</>)}
              </button>
              
              <button onClick={() => setBooking(null)} className="w-full mt-6 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-black">Zrušiť a späť</button>
            </div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto w-full">
            {activeTab === 'scan' ? (
              <div className="animate-in fade-in w-full">
                <button onClick={() => setIsScanning(true)} className="w-full bg-black text-white py-14 rounded-[2.5rem] shadow-2xl shadow-black/20 flex flex-col items-center justify-center gap-6 active:scale-95 transition-transform mb-10">
                  <ScanLine className="w-16 h-16" />
                  <span className="text-xl font-black uppercase tracking-widest">Skenovať QR</span>
                </button>
                <div className="flex items-center gap-4 mb-8"><div className="flex-1 h-px bg-gray-300"></div><span className="font-black uppercase tracking-[0.2em] text-[10px]">Ručný kód</span><div className="flex-1 h-px bg-gray-300"></div></div>
                <div className="bg-white p-2 rounded-[2rem] flex border-2 border-gray-200 focus-within:border-black transition-all shadow-sm">
                  <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="Zadajte kód" className="flex-1 bg-transparent px-4 py-4 outline-none font-black text-xl tracking-[0.3em] text-black w-full" maxLength={6} />
                  <button onClick={() => handleSearch(manualCode)} disabled={manualCode.length < 6 || isLoading} className="bg-black text-white px-6 rounded-[1.5rem] disabled:opacity-20 flex items-center justify-center shrink-0">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in w-full">
                <h3 className="text-xl font-black mb-6">Aktívne rezervácie</h3>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <Package className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">V úschovni nie sú žiadne batožiny</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map(b => (
                      <button key={b.id} onClick={() => setBooking(b)} className="w-full bg-white p-5 rounded-3xl shadow-lg border-2 border-gray-100 flex flex-col active:scale-95 transition-transform text-left group">
                        <div className="flex justify-between items-start w-full mb-3 gap-2">
                          <div className="overflow-hidden">
                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest inline-block mb-1.5 ${b.status === 'PENDING' ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                              {b.status === 'PENDING' ? 'Na príchod' : 'V úschovni'}
                            </div>
                            <h4 className="font-black text-black text-base truncate">{b.userName}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{b.items?.length || 0} ks • {b.bookingId}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors shrink-0"><ArrowRight className="w-4 h-4" /></div>
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

      <nav className="absolute bottom-0 w-full bg-white border-t-2 border-gray-100 p-4 pb-8 flex gap-4 justify-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => { setBooking(null); setActiveTab('scan'); }} className={`w-full max-w-[180px] flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'scan' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-gray-400 hover:bg-gray-50'}`}>
          <QrCode className="w-5 h-5" /><span className="text-[10px] font-black uppercase tracking-widest">Skenovať</span>
        </button>
        <button onClick={() => { setBooking(null); setActiveTab('list'); }} className={`w-full max-w-[180px] flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'list' ? 'bg-black text-white shadow-xl shadow-black/20' : 'text-gray-400 hover:bg-gray-50'}`}>
          <div className="relative"><List className="w-5 h-5" />{activeBookings.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black bg-red-500 text-white">{activeBookings.length}</span>}</div>
          <span className="text-[10px] font-black uppercase tracking-widest">Aktívne</span>
        </button>
      </nav>
    </main>
  );
}