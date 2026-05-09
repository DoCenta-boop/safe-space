'use client';

import { useState, useEffect } from 'react';
import { Store, Plus, MapPin, Shield, Activity, Briefcase, Luggage, Package, KeyRound, Loader2, Link as LinkIcon, ExternalLink, BarChart3, Download, Lock, Check, Trash2, Edit, RefreshCw, PauseCircle, PlayCircle, XCircle, Settings, List as ListIcon } from 'lucide-react';
import { addLocation, getLocations, updateLocationData, deleteLocationData, resetLocationPin, toggleLocationActive, cancelBookingStatus, getPricingConfig, updatePricingConfig, listenToAllBookings } from '../../lib/bookingService';
import { verifyAdmin } from '../../lib/auth';
import Link from 'next/link';

export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; name: string; address: string; pin?: string; slug?: string; isActive?: boolean;
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; 
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ small: 5, medium: 7, large: 10 });
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'stats' | 'bookings' | 'manage' | 'settings'>('stats');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoc, setEditLoc] = useState({ name: '', address: '', smallCap: 0, mediumCap: 0, largeCap: 0 });

  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    const [locResult, priceResult] = await Promise.all([getLocations(), getPricingConfig()]);
    if (locResult.success) setLocations(locResult.data as Location[]);
    if (priceResult.success) setPricing(priceResult.data as any);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const isValid = await verifyAdmin(username, password);
    if (isValid) {
      setIsAuthenticated(true);
      loadData();
    } else {
      setLoginError('Nesprávne meno alebo heslo');
    }
    setIsLoggingIn(false);
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (isAuthenticated) {
      unsubscribe = listenToAllBookings((liveBookings) => {
        setBookings(liveBookings);
      });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isAuthenticated]);

  const filteredBookings = bookings.filter(b => {
    if (filterLocation !== 'ALL' && b.locationId !== filterLocation) return false;
    if (filterPeriod !== 'ALL' && b.createdAt) {
      const bookingDate = new Date(b.createdAt.seconds * 1000);
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filterPeriod === 'WEEK' && diffDays > 7) return false;
      if (filterPeriod === 'MONTH' && diffDays > 30) return false;
    }
    return true;
  });

  const validBookings = filteredBookings.filter(b => b.status !== 'CANCELLED');
  const totalRevenue = validBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalBags = validBookings.reduce((sum, b) => sum + (b.items?.length || 0), 0);
  const totalCompleted = validBookings.filter(b => b.status === 'COMPLETED').length;
  const avgDays = validBookings.length > 0 ? (validBookings.reduce((sum, b) => sum + (Number(b.bookingDays) || 1), 0) / validBookings.length).toFixed(1) : 0;

  let sizeStats = { received: { small: 0, medium: 0, large: 0 }, completed: { small: 0, medium: 0, large: 0 } };
  
  validBookings.forEach(b => {
    b.items?.forEach((item: any) => {
      const str = String(item.id || item.label || '').toLowerCase();
      let isSmall = str.includes('small') || str.includes('mal');
      let isMedium = str.includes('medium') || str.includes('stred');
      let isLarge = str.includes('large') || str.includes('vel') || str.includes('veľ');

      if (isSmall) sizeStats.received.small++; 
      else if (isMedium) sizeStats.received.medium++; 
      else if (isLarge) sizeStats.received.large++;

      if (b.status === 'COMPLETED') {
        if (isSmall) sizeStats.completed.small++; 
        else if (isMedium) sizeStats.completed.medium++; 
        else if (isLarge) sizeStats.completed.large++;
      }
    });
  });

  const handleExportCSV = () => {
    const headers = ['Kód', 'Zákazník', 'Telefón', 'Suma EUR', 'Spolu Tašiek', 'Malé', 'Stredné', 'Veľké', 'Status', 'Dátum'];
    const rows = filteredBookings.map(b => {
      const date = b.createdAt ? new Date(b.createdAt.seconds * 1000).toLocaleDateString('sk-SK') : 'Neznámy';
      let s = 0, m = 0, l = 0;
      
      b.items?.forEach((item: any) => { 
        const str = String(item.id || item.label || '').toLowerCase();
        if (str.includes('small') || str.includes('mal')) s++; 
        else if (str.includes('medium') || str.includes('stred')) m++; 
        else if (str.includes('large') || str.includes('vel') || str.includes('veľ')) l++; 
      });
      
      return [ b.bookingId, `"${b.userName}"`, `"${b.userPhone || ''}"`, b.totalPrice, b.items?.length || 0, s, m, l, b.status, date ].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SafeSpace_Report_${filterLocation}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddLocation = async () => { 
    if (!newLoc.name || !newLoc.address) return alert("Vyplňte názov a adresu podniku.");
    setIsSubmitting(true);
    const result = await addLocation({
      name: newLoc.name, address: newLoc.address, isActive: true,
      capacities: {
        small: { max: newLoc.smallCap, occupied: 0 }, medium: { max: newLoc.mediumCap, occupied: 0 }, large: { max: newLoc.largeCap, occupied: 0 }
      },
      mapPosition: { top: '50%', left: '50%' } 
    });
    if (result.success) { alert("Podnik vytvorený!"); loadData(); setShowAddForm(false); setNewLoc({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 }); }
    setIsSubmitting(false);
  };

  const handleEditClick = (loc: Location) => {
    setEditingId(loc.id);
    setEditLoc({ name: loc.name, address: loc.address, smallCap: loc.capacities.small.max, mediumCap: loc.capacities.medium.max, largeCap: loc.capacities.large.max });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsSubmitting(true);
    const originalLoc = locations.find(l => l.id === editingId);
    if (originalLoc) {
      await updateLocationData(editingId, {
        name: editLoc.name, address: editLoc.address,
        capacities: {
          small: { max: editLoc.smallCap, occupied: originalLoc.capacities.small.occupied },
          medium: { max: editLoc.mediumCap, occupied: originalLoc.capacities.medium.occupied },
          large: { max: editLoc.largeCap, occupied: originalLoc.capacities.large.occupied }
        }
      });
      setEditingId(null); loadData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Naozaj chcete natrvalo vymazať podnik "${name}"?`)) {
      setIsLoading(true); await deleteLocationData(id); loadData();
    }
  };

  const handleResetPin = async (id: string, name: string) => {
    if (window.confirm(`Vygenerovať nový PIN pre "${name}"?`)) {
      setIsLoading(true); const result = await resetLocationPin(id);
      if (result.success) { alert(`Nový PIN pre ${name} je: ${result.newPin}`); loadData(); }
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    if (window.confirm(currentStatus ? `Pozastaviť podnik "${name}"? Zmizne z mapy zákazníkov.` : `Znovu aktivovať podnik "${name}"?`)) {
      setIsLoading(true); await toggleLocationActive(id, currentStatus); loadData();
    }
  };

  const handleCancelBooking = async (id: string, code: string) => {
    if (window.confirm(`Naozaj chcete natrvalo STORNOVAŤ rezerváciu ${code}?`)) {
      setIsLoading(true); await cancelBookingStatus(id);
      setIsLoading(false);
    }
  };

  const handleSavePricing = async () => {
    setIsSubmitting(true);
    await updatePricingConfig(pricing);
    alert("Cenník bol úspešne aktualizovaný!");
    setIsSubmitting(false);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 text-center flex flex-col items-center">
          
          {/* BRANDING LOGO NA PRIHLÁSENÍ */}
          <div className="mb-8 flex items-center justify-center">
            <span className="text-3xl font-black text-[#0f172a] tracking-tighter">Docenta</span>
            <span className="text-3xl font-black text-blue-600 tracking-tighter ml-1.5">SPACES</span>
          </div>

          <h1 className="text-xl font-bold mb-8 text-gray-400 uppercase tracking-widest">Admin prihlásenie</h1>
          <form onSubmit={handleLogin} className="space-y-4 w-full">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Meno" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-black font-bold" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Heslo" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-black font-bold" />
            {loginError && <p className="text-red-500 font-bold text-sm">{loginError}</p>}
            <button type="submit" disabled={isLoggingIn} className="w-full bg-black text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2">
              {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : "Prihlásiť sa"}
            </button>
          </form>
        </div>

        {/* PÄTIČKA */}
        <div className="absolute bottom-6 w-full text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Powered by Docenta</p>
        </div>
      </main>
    );
  }

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>;

  const activeBookingsList = bookings.filter(b => b.status === 'PENDING' || b.status === 'STORED');

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col p-4 md:p-6 font-sans text-black">
      <header className="mb-6 mt-2 md:mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* BRANDING LOGO V HLAVIČKE ADMINA */}
          <div className="mb-1 flex items-center">
            <span className="text-2xl font-black text-[#0f172a] tracking-tighter">Docenta</span>
            <span className="text-2xl font-black text-blue-600 tracking-tighter ml-1.5">SPACES</span>
          </div>
          
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 text-gray-700">
            <Shield className="w-5 h-5 text-red-600" /> SuperAdmin
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
          </p>
          <button onClick={() => setIsAuthenticated(false)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black">Odhlásiť</button>
        </div>
      </header>

      {/* Navigačné taby */}
      <div className="grid grid-cols-2 md:flex bg-gray-200 p-1.5 rounded-2xl mb-8 gap-1">
        <button onClick={() => setActiveTab('stats')} className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><BarChart3 className="w-4 h-4" /> Štatistiky</button>
        <button onClick={() => setActiveTab('bookings')} className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'bookings' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><ListIcon className="w-4 h-4" /> Rezervácie</button>
        <button onClick={() => setActiveTab('manage')} className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'manage' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><Store className="w-4 h-4" /> Podniky</button>
        <button onClick={() => setActiveTab('settings')} className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}><Settings className="w-4 h-4" /> Cenník</button>
      </div>

      <div className="flex-1 pb-10">
        {/* --- TAB: ŠTATISTIKY --- */}
        {activeTab === 'stats' && (
          <div className="animate-in fade-in">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Filtrovať podnik</label><select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-black font-bold py-3 px-4 rounded-xl outline-none"><option value="ALL">Všetky podniky</option>{locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}</select></div>
              <div className="flex-1"><label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Obdobie</label><select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-black font-bold py-3 px-4 rounded-xl outline-none"><option value="ALL">Od začiatku</option><option value="MONTH">Posledných 30 dní</option><option value="WEEK">Posledných 7 dní</option></select></div>
              <button onClick={handleExportCSV} className="bg-blue-600 text-white font-black py-3 px-6 rounded-xl flex items-center justify-center gap-2 mt-4 md:mt-0 active:scale-95"><Download className="w-5 h-5"/> Export CSV</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"><div className="text-3xl font-black text-green-600">{totalRevenue} €</div><div className="text-[10px] font-black text-gray-400 uppercase mt-1">Tržby</div></div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"><div className="text-3xl font-black text-black">{totalBags}</div><div className="text-[10px] font-black text-gray-400 uppercase mt-1">Prijaté kusy</div></div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"><div className="text-3xl font-black text-black">{totalCompleted}</div><div className="text-[10px] font-black text-gray-400 uppercase mt-1">Vydané / Hotovo</div></div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"><div className="text-3xl font-black text-black">{avgDays}</div><div className="text-[10px] font-black text-gray-400 uppercase mt-1">Priemerná doba (Dni)</div></div>
            </div>

            <h3 className="font-black text-lg mb-4">Pohyb batožiny podľa veľkostí</h3>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-8 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Veľkosť</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Prijaté</th>
                    <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Vydané</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="p-4 flex items-center gap-3"><div className="p-2 bg-gray-50 rounded-lg"><Briefcase className="w-4 h-4 text-gray-400"/></div><span className="font-bold text-sm">Malá</span></td><td className="p-4 text-center font-black text-lg">{sizeStats.received.small}</td><td className="p-4 text-center font-black text-lg text-green-600">{sizeStats.completed.small}</td></tr>
                  <tr><td className="p-4 flex items-center gap-3"><div className="p-2 bg-gray-50 rounded-lg"><Luggage className="w-4 h-4 text-gray-400"/></div><span className="font-bold text-sm">Stredná</span></td><td className="p-4 text-center font-black text-lg">{sizeStats.received.medium}</td><td className="p-4 text-center font-black text-lg text-green-600">{sizeStats.completed.medium}</td></tr>
                  <tr><td className="p-4 flex items-center gap-3"><div className="p-2 bg-gray-50 rounded-lg"><Package className="w-4 h-4 text-gray-400"/></div><span className="font-bold text-sm">Veľká</span></td><td className="p-4 text-center font-black text-lg">{sizeStats.received.large}</td><td className="p-4 text-center font-black text-lg text-green-600">{sizeStats.completed.large}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: REZERVÁCIE (Stornovanie) --- */}
        {activeTab === 'bookings' && (
          <div className="animate-in fade-in">
            <h2 className="text-xl font-black mb-6">Správa aktuálnych rezervácií ({activeBookingsList.length})</h2>
            {activeBookingsList.length === 0 ? (
               <div className="text-center py-10 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-3xl">Žiadne aktívne rezervácie.</div>
            ) : (
              <div className="space-y-4 pb-20">
                {activeBookingsList.map(b => {
                  const locName = locations.find(l => l.id === b.locationId)?.name || 'Neznámy podnik';
                  return (
                    <div key={b.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-2 inline-block ${b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {b.status === 'PENDING' ? 'Očakávané' : 'V úschovni'}
                        </span>
                        <h4 className="font-black text-lg flex items-center gap-2">{b.userName} <span className="text-xs text-gray-400 font-mono">({b.bookingId})</span></h4>
                        <p className="text-xs font-bold text-gray-500 mt-1"><MapPin className="w-3 h-3 inline"/> {locName} • {b.items?.length || 0} ks • {b.totalPrice} €</p>
                      </div>
                      <button onClick={() => handleCancelBooking(b.id, b.bookingId)} className="bg-red-50 text-red-600 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4"/> Stornovať
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: NASTAVENIA CENNÍKA --- */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in max-w-md mx-auto">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black mb-2 text-center">Základný cenník</h2>
              <p className="text-xs text-gray-500 font-bold text-center mb-8">Zmeňte ceny za 1 deň úschovy (v €)</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="font-black flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-400"/> Malá batožina</span>
                  <div className="flex items-center gap-2"><input type="number" value={pricing.small} onChange={e => setPricing({...pricing, small: Number(e.target.value)})} className="w-16 p-2 text-center font-black rounded-lg border"/> €</div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="font-black flex items-center gap-2"><Luggage className="w-5 h-5 text-gray-400"/> Stredná batožina</span>
                  <div className="flex items-center gap-2"><input type="number" value={pricing.medium} onChange={e => setPricing({...pricing, medium: Number(e.target.value)})} className="w-16 p-2 text-center font-black rounded-lg border"/> €</div>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="font-black flex items-center gap-2"><Package className="w-5 h-5 text-gray-400"/> Veľká batožina</span>
                  <div className="flex items-center gap-2"><input type="number" value={pricing.large} onChange={e => setPricing({...pricing, large: Number(e.target.value)})} className="w-16 p-2 text-center font-black rounded-lg border"/> €</div>
                </div>
              </div>

              <button onClick={handleSavePricing} disabled={isSubmitting} className="w-full bg-black text-white font-black py-4 rounded-2xl active:scale-95 transition-all">
                {isSubmitting ? "Ukladám..." : "Uložiť cenník"}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: SPRÁVA PODNIKOV --- */}
        {activeTab === 'manage' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Zoznam podnikov ({locations.length})</h2>
              <button onClick={() => setShowAddForm(!showAddForm)} className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Pridať nový
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-200 mb-8 shadow-sm">
                <h3 className="font-black mb-4">Nové miesto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input type="text" placeholder="Názov" value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-black" />
                  <input type="text" placeholder="Adresa" value={newLoc.address} onChange={(e) => setNewLoc({...newLoc, address: e.target.value})} className="p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center"><span className="text-[10px] font-black text-gray-400 uppercase">Malé</span><input type="number" value={newLoc.smallCap} onChange={(e) => setNewLoc({...newLoc, smallCap: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl text-center font-black" /></div>
                  <div className="text-center"><span className="text-[10px] font-black text-gray-400 uppercase">Stredné</span><input type="number" value={newLoc.mediumCap} onChange={(e) => setNewLoc({...newLoc, mediumCap: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl text-center font-black" /></div>
                  <div className="text-center"><span className="text-[10px] font-black text-gray-400 uppercase">Veľké</span><input type="number" value={newLoc.largeCap} onChange={(e) => setNewLoc({...newLoc, largeCap: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl text-center font-black" /></div>
                </div>
                <button onClick={handleAddLocation} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20">{isSubmitting ? "Vytváram..." : "Vytvoriť a vygenerovať prístup"}</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {locations.map(loc => {
                const isEditing = editingId === loc.id;
                const isActive = loc.isActive !== false;
                
                if (isEditing) {
                  return (
                    <div key={loc.id} className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-200">
                      <h3 className="font-black text-blue-900 mb-4">Upraviť podnik</h3>
                      <div className="space-y-3 mb-4">
                        <input type="text" value={editLoc.name} onChange={(e) => setEditLoc({...editLoc, name: e.target.value})} className="w-full p-3 bg-white border rounded-xl font-bold" />
                        <input type="text" value={editLoc.address} onChange={(e) => setEditLoc({...editLoc, address: e.target.value})} className="w-full p-3 bg-white border rounded-xl font-bold" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="text-center"><span className="text-[9px] font-black text-gray-500 uppercase">Max Malé</span><input type="number" value={editLoc.smallCap} onChange={(e) => setEditLoc({...editLoc, smallCap: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-center font-black" /></div>
                        <div className="text-center"><span className="text-[9px] font-black text-gray-500 uppercase">Max Stredné</span><input type="number" value={editLoc.mediumCap} onChange={(e) => setEditLoc({...editLoc, mediumCap: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-center font-black" /></div>
                        <div className="text-center"><span className="text-[9px] font-black text-gray-500 uppercase">Max Veľké</span><input type="number" value={editLoc.largeCap} onChange={(e) => setEditLoc({...editLoc, largeCap: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg text-center font-black" /></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-white text-gray-500 font-bold py-3 rounded-xl border">Zrušiť</button>
                        <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Uložiť</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={loc.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border flex flex-col h-full ${!isActive ? 'border-red-200 opacity-70' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {!isActive && <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-md mb-2 inline-block">Pozastavené</span>}
                        <h3 className="font-black text-xl">{loc.name}</h3>
                        <p className="text-xs text-gray-400 font-bold"><MapPin className="w-3 h-3 inline mr-1"/> {loc.address}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleToggleActive(loc.id, isActive, loc.name)} className={`p-2 rounded-lg transition-colors ${isActive ? 'text-orange-400 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`} title={isActive ? "Pozastaviť podnik" : "Aktivovať podnik"}>{isActive ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}</button>
                        <button onClick={() => handleEditClick(loc)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Upraviť údaje"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleResetPin(loc.id, loc.name)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors" title="Resetovať PIN"><RefreshCw className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(loc.id, loc.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Vymazať podnik"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-4 mt-2">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Briefcase className="w-3 h-3"/> {loc.capacities.small.max}</span>
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Luggage className="w-3 h-3"/> {loc.capacities.medium.max}</span>
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Package className="w-3 h-3"/> {loc.capacities.large.max}</span>
                    </div>

                    <div className="mt-auto space-y-2 bg-gray-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-400 uppercase">Odkaz pre personál:</span>
                        <Link href={`/partner/${loc.slug}`} target="_blank" className="text-blue-600 font-black flex items-center gap-1">/{loc.slug} <ExternalLink className="w-3 h-3"/></Link>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-400 uppercase">Prihlasovací PIN:</span>
                        <span className="font-mono font-black text-lg tracking-widest text-black">{loc.pin}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PÄTIČKA ADMINA */}
      <div className="w-full text-center pb-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Powered by Docenta</p>
      </div>

    </main>
  );
}