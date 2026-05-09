'use client';
import { useState, useEffect } from 'react';
import { Store, Plus, MapPin, Shield, Activity, Briefcase, Luggage, Package, KeyRound, Loader2 } from 'lucide-react';
// Importujeme databázové funkcie
import { addLocation, getLocations } from '../../lib/bookingService';

export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; 
  name: string; 
  address: string; 
  pin?: string; // Pridané pole pre PIN
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; 
};

export default function AdminDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newLoc, setNewLoc] = useState({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });

  // Načítanie skutočných podnikov z databázy po zapnutí stránky
  useEffect(() => {
    async function loadData() {
      const result = await getLocations();
      if (result.success && result.data) {
        setLocations(result.data as Location[]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Vytvorenie nového podniku a zápis do databázy
  const handleAddLocation = async () => {
    if (!newLoc.name || !newLoc.address) {
      alert("Vyplňte názov a adresu podniku.");
      return;
    }

    setIsSubmitting(true);

    const locationToSave = {
      name: newLoc.name,
      address: newLoc.address,
      capacities: {
        small: { max: newLoc.smallCap, occupied: 0 },
        medium: { max: newLoc.mediumCap, occupied: 0 },
        large: { max: newLoc.largeCap, occupied: 0 }
      },
      mapPosition: { top: '50%', left: '50%' } // Neskôr môžeme pridať výber bodu na mape
    };

    const result = await addLocation(locationToSave);

    if (result.success) {
      // Pridanie nového podniku hneď aj do zobrazenia (vrátane vygenerovaného PINu)
      const newlyAdded: Location = {
        id: result.id as string,
        ...locationToSave,
        pin: result.pin as string
      };
      setLocations([...locations, newlyAdded]);
      setShowAddForm(false);
      setNewLoc({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });
      alert(`Podnik vytvorený!\nVygenerovaný PIN pre prihlásenie personálu je: ${result.pin}`);
    } else {
      alert("Chyba pri vytváraní podniku.");
    }
    
    setIsSubmitting(false);
  };

  const totalOccupied = locations.reduce((acc, loc) => 
    acc + loc.capacities.small.occupied + loc.capacities.medium.occupied + loc.capacities.large.occupied, 0
  );

  // Zobrazenie načítavania
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
        <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Načítavam podniky</p>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col p-6 font-sans">
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Admin Panel
          </h1>
          <p className="text-gray-500 font-medium text-sm">Správa podnikov a kapacít</p>
        </div>
      </header>

      {/* Rýchle štatistiky */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-1"><Store className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-black">{locations.length}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Podnikov</div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-1"><Activity className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-black">{totalOccupied}</div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Batožín celkom</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-black">Zoznam podnikov</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Pridať
        </button>
      </div>

      {/* Formulár na pridanie nového podniku */}
      {showAddForm && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold mb-4 text-black text-lg">Nový podnik</h3>
          <input type="text" placeholder="Názov (napr. Kaviareň)" value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-3 rounded-xl border mb-3 bg-gray-50 outline-none focus:border-black text-black font-bold" />
          <input type="text" placeholder="Adresa" value={newLoc.address} onChange={(e) => setNewLoc({...newLoc, address: e.target.value})} className="w-full p-3 rounded-xl border mb-4 bg-gray-50 outline-none focus:border-black text-black font-bold" />
          
          <h4 className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Maximálna kapacita miest:</h4>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1 uppercase"><Briefcase className="w-3 h-3"/> Malé</span>
              <input type="number" min="0" value={newLoc.smallCap} onChange={(e) => setNewLoc({...newLoc, smallCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1 uppercase"><Luggage className="w-3 h-3"/> Stredné</span>
              <input type="number" min="0" value={newLoc.mediumCap} onChange={(e) => setNewLoc({...newLoc, mediumCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1 uppercase"><Package className="w-3 h-3"/> Veľké</span>
              <input type="number" min="0" value={newLoc.largeCap} onChange={(e) => setNewLoc({...newLoc, largeCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-black text-black text-lg" />
            </div>
          </div>

          <button onClick={handleAddLocation} disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl active:scale-95 transition-transform uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Uložiť a generovať PIN"}
          </button>
        </div>
      )}

      {/* Zoznam podnikov zo skutočnej databázy */}
      {locations.length === 0 ? (
        <div className="text-center py-10 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-3xl mt-4">
          Nemáte vytvorené žiadne podniky.
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map(loc => {
            const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
            const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
            const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
            const isCompletelyFull = sFree === 0 && mFree === 0 && lFree === 0;

            return (
              <div key={loc.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-black text-xl mb-1">{loc.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 font-bold"><MapPin className="w-3 h-3" /> {loc.address}</p>
                    
                    {/* Zobrazenie PIN kódu iba v Admine */}
                    {loc.pin && (
                      <div className="mt-3 flex items-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-200 w-fit">
                        <KeyRound className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">PIN:</span>
                        <span className="font-black font-mono tracking-widest text-lg">{loc.pin}</span>
                      </div>
                    )}
                  </div>
                  {isCompletelyFull ? (
                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Plné</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Aktívne</span>
                  )}
                </div>

                {/* Ukazovatele kapacít */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Briefcase, cap: loc.capacities.small, free: sFree },
                    { icon: Luggage, cap: loc.capacities.medium, free: mFree },
                    { icon: Package, cap: loc.capacities.large, free: lFree }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <item.icon className="w-4 h-4 text-black" />
                        <span className="text-xs font-black text-black">
                          {item.cap.occupied}<span className="text-gray-400 mx-0.5">/</span>{item.cap.max}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${item.free === 0 ? 'bg-red-500' : 'bg-black'}`} 
                          style={{ width: `${item.cap.max === 0 ? 0 : (item.cap.occupied / item.cap.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}