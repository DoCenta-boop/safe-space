'use client';

import { useState, useEffect } from 'react';
import { Store, Plus, MapPin, Shield, Activity, Briefcase, Luggage, Package, KeyRound, Loader2, Link as LinkIcon, ExternalLink, BarChart3, Download, Lock, Check } from 'lucide-react';
import { addLocation, getLocations, getAllBookings } from '../../lib/bookingService';
import Link from 'next/link';

export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; name: string; address: string; pin?: string; slug?: string;
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; 
};

// --- TVOJE PRIHLASOVACIE ÚDAJE DO ADMINU ---
const ADMIN_USER = "tomas";
const ADMIN_PASS = "admin123"; 

export default function AdminDashboard() {
  // Autentifikácia
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dáta
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI Stavy
  const [activeTab, setActiveTab] = useState<'stats' | 'manage'>('stats');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });

  // Filtre pre štatistiky
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL'); // ALL, MONTH, WEEK

  // Načítanie dát po prihlásení
  const loadData = async () => {
    setIsLoading(true);
    const [locResult, bookResult] = await Promise.all([getLocations(), getAllBookings()]);
    if (locResult.success) setLocations(locResult.data as Location[]);
    if (bookResult.success) setBookings(bookResult.data as any[]);
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      setLoginError('');
      loadData(); // Načítaj dáta až keď je prihlásený
    } else {
      setLoginError('Nesprávne meno alebo heslo');
    }
  };

  // --- LOGIKA PRE ŠTATISTIKY ---
  const getFilteredBookings = () => {
    return bookings.filter(b => {
      // 1. Filter podľa podniku
      if (filterLocation !== 'ALL' && b.locationId !== filterLocation) return false;
      
      // 2. Filter podľa obdobia
      if (filterPeriod !== 'ALL' && b.createdAt) {
        const bookingDate = new Date(b.createdAt.seconds * 1000);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - bookingDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterPeriod === 'WEEK' && diffDays > 7) return false;
        if (filterPeriod === 'MONTH' && diffDays > 30) return false;
      }
      return true;
    });
  };

  const filteredBookings = getFilteredBookings();

  // Výpočty
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalBags = filteredBookings.reduce((sum, b) => sum + (b.items?.length || 0), 0);
  const totalCompleted = filteredBookings.filter(b => b.status === 'COMPLETED').length;
  const avgDays = filteredBookings.length > 0 ? (filteredBookings.reduce((sum, b) => sum + (Number(b.bookingDays) || 1), 0) / filteredBookings.length).toFixed(1) : 0;
  
  // Analýza veľkostí
  let sizeStats = { small: 0, medium: 0, large: 0 };
  filteredBookings.forEach(b => {
    b.items?.forEach((item: any) => {
      if (item.id === 'small') sizeStats.small++;
      if (item.id === 'medium') sizeStats.medium++;
      if (item.id === 'large') sizeStats.large++;
    });
  });

  // Export do CSV
  const handleExportCSV = () => {
    const headers = ['Kód', 'Zákazník', 'Telefón', 'Suma EUR', 'Počet Tašiek', 'Status', 'Dátum'];
    const rows = filteredBookings.map(b => {
      const date = b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleDateString('sk-SK') : 'Neznámy';
      return `${b.bookingId},${b.userName},${b.userPhone || ''},${b.totalPrice},${b.items?.length || 0},${b.status},${date}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${filterLocation}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGIKA PRE PODNIKY ---
  const handleAddLocation = async () => {
    if (!newLoc.name || !newLoc.address) return alert("Vyplňte názov a adresu podniku.");
    setIsSubmitting(true);
    const result = await addLocation({
      name: newLoc.name, address: newLoc.address,
      capacities: {
        small: { max: newLoc.smallCap, occupied: 0 },
        medium: { max: newLoc.mediumCap, occupied: 0 },
        large: { max: newLoc.largeCap, occupied: 0 }
      },
      mapPosition: { top: '50%', left: '50%' } 
    });

    if (result.success) {
      alert(`Podnik vytvorený!\nOdkaz: /partner/${result.slug}\nPIN: ${result.pin}`);
      loadData();
      setShowAddForm(false);
      setNewLoc({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });
    } else {
      alert("Chyba pri vytváraní podniku.");
    }
    setIsSubmitting(false);
  };


  // --- ZOBRAZENIA ---

  if (!isAuthenticated) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-black mb-2">Admin Panel</h1>
          <p className="text-gray-500 text-sm font-bold mb-8">Prihláste sa pre prístup k systému.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Prihlasovacie meno" className="w-full text-center font-bold py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-black text-black" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Heslo" className="w-full text-center font-bold py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-black text-black" />
            {loginError && <p className="text-red-500 font-bold text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-black text-white font-black text-lg py-5 rounded-2xl active:scale-95 transition-transform mt-4">Prihlásiť sa</button>
          </form>
        </div>
      </main>
    );
  }

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>;

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col p-6 font-sans text-black">
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><Shield className="w-6 h-6 text-red-600" /> SuperAdmin</h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Riadiace centrum</p>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black">Odhlásiť</button>
      </header>

      {/* Taby */}
      <div className="flex bg-gray-200 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('stats')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><BarChart3 className="w-4 h-4" /> Štatistiky</button>
        <button onClick={() => setActiveTab('manage')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'manage' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><Store className="w-4 h-4" /> Podniky</button>
      </div>

      {/* ZÁLOŽKA: ŠTATISTIKY */}
      {activeTab === 'stats' && (
        <div className="animate-in fade-in">
          {/* Filtre */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Filtrovať podnik</label>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-black font-bold py-3 px-4 rounded-xl outline-none">
                <option value="ALL">Všetky podniky (Globálne)</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Obdobie</label>
              <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-black font-bold py-3 px-4 rounded-xl outline-none">
                <option value="ALL">Od začiatku</option>
                <option value="MONTH">Posledných 30 dní</option>
                <option value="WEEK">Posledných 7 dní</option>
              </select>
            </div>
            <button onClick={handleExportCSV} className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl flex items-center justify-center gap-2 mt-4 md:mt-0 active:scale-95 transition-transform"><Download className="w-5 h-5"/> Export CSV</button>
          </div>

          {/* Rýchle čísla */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-2"><Activity className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-green-600">{totalRevenue} €</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Tržby za obdobie</div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-2"><Package className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-black">{totalBags}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Prijatých batožín</div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-2"><Check className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-black">{totalCompleted}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Vydaných / Hotovo</div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="text-gray-400 mb-2"><Activity className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-black">{avgDays}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Priemerná doba (Dni)</div>
            </div>
          </div>

          {/* Analýza veľkostí */}
          <h3 className="font-black text-lg mb-4">Aké batožiny si odkladajú?</h3>
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center"><Briefcase className="w-6 h-6 mx-auto mb-2 text-gray-400"/><span className="block text-2xl font-black">{sizeStats.small}</span><span className="text-[10px] font-black text-gray-400 uppercase">Malé</span></div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center"><Luggage className="w-6 h-6 mx-auto mb-2 text-gray-400"/><span className="block text-2xl font-black">{sizeStats.medium}</span><span className="text-[10px] font-black text-gray-400 uppercase">Stredné</span></div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center"><Package className="w-6 h-6 mx-auto mb-2 text-gray-400"/><span className="block text-2xl font-black">{sizeStats.large}</span><span className="text-[10px] font-black text-gray-400 uppercase">Veľké</span></div>
          </div>
        </div>
      )}

      {/* ZÁLOŽKA: SPRÁVA PODNIKOV */}
      {activeTab === 'manage' && (
        <div className="animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-black">Zoznam podnikov ({locations.length})</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"><Plus className="w-4 h-4" /> Pridať</button>
          </div>

          {showAddForm && (
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold mb-4 text-black text-lg">Nový podnik</h3>
              <input type="text" placeholder="Názov (napr. Kaviareň)" value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-3 rounded-xl border mb-3 bg-gray-50 outline-none focus:border-black text-black font-bold" />
              <input type="text" placeholder="Adresa" value={newLoc.address} onChange={(e) => setNewLoc({...newLoc, address: e.target.value})} className="w-full p-3 rounded-xl border mb-4 bg-gray-50 outline-none focus:border-black text-black font-bold" />
              
              <h4 className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Maximálna kapacita miest:</h4>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center"><span className="text-[10px] font-black text-gray-400 mb-2 uppercase"><Briefcase className="w-3 h-3 inline"/> Malé</span><input type="number" min="0" value={newLoc.smallCap} onChange={(e) => setNewLoc({...newLoc, smallCap: parseInt(e.target.value)||0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" /></div>
                <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center"><span className="text-[10px] font-black text-gray-400 mb-2 uppercase"><Luggage className="w-3 h-3 inline"/> Stredné</span><input type="number" min="0" value={newLoc.mediumCap} onChange={(e) => setNewLoc({...newLoc, mediumCap: parseInt(e.target.value)||0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" /></div>
                <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center"><span className="text-[10px] font-black text-gray-400 mb-2 uppercase"><Package className="w-3 h-3 inline"/> Veľké</span><input type="number" min="0" value={newLoc.largeCap} onChange={(e) => setNewLoc({...newLoc, largeCap: parseInt(e.target.value)||0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" /></div>
              </div>
              <button onClick={handleAddLocation} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl active:scale-95 flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Vytvoriť podnik"}</button>
            </div>
          )}

          <div className="space-y-4">
            {locations.map(loc => (
              <div key={loc.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-black text-black text-xl mb-1">{loc.name}</h3>
                <p className="text-xs text-gray-500 font-bold mb-4 flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc.address}</p>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 w-full flex flex-col gap-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prístup pre personál</p>
                  <Link href={`/partner/${loc.slug}`} target="_blank" className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200">
                    <div className="flex gap-2 items-center overflow-hidden"><LinkIcon className="w-4 h-4 text-blue-500 shrink-0" /><span className="font-mono text-xs text-blue-600 truncate">/partner/{loc.slug}</span></div><ExternalLink className="w-4 h-4 text-gray-300" />
                  </Link>
                  <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-yellow-600" /><span className="text-xs font-bold text-yellow-800">PIN:</span></div>
                    <span className="font-black font-mono tracking-widest text-lg text-yellow-900">{loc.pin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}