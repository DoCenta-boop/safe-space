'use client';
import { useState } from 'react';
import { Store, Plus, MapPin, Shield, Activity, Briefcase, Luggage, Package } from 'lucide-react';

// Používame novú, detailnú štruktúru kapacít
export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; 
  name: string; 
  address: string; 
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; 
};

const MOCK_LOCATIONS: Location[] = [
  { 
    id: 'L1', name: 'Kaviareň Centrum', address: 'Hlavné námestie 4', 
    capacities: { small: { max: 10, occupied: 8 }, medium: { max: 5, occupied: 5 }, large: { max: 2, occupied: 1 } },
    mapPosition: { top: '30%', left: '40%' }
  },
  { 
    id: 'L2', name: 'Hotel Bratislava', address: 'Štefánikova 12', 
    capacities: { small: { max: 20, occupied: 5 }, medium: { max: 15, occupied: 10 }, large: { max: 10, occupied: 2 } },
    mapPosition: { top: '60%', left: '60%' }
  },
  { 
    id: 'L3', name: 'Mini Potraviny', address: 'Obchodná 1', 
    capacities: { small: { max: 5, occupied: 5 }, medium: { max: 2, occupied: 2 }, large: { max: 0, occupied: 0 } },
    mapPosition: { top: '20%', left: '70%' }
  },
];

export default function AdminDashboard() {
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Nový stav pre formulár s rozdelenými kapacitami
  const [newLoc, setNewLoc] = useState({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });

  const handleAddLocation = () => {
    const loc: Location = {
      id: `L${locations.length + 1}`,
      name: newLoc.name,
      address: newLoc.address,
      capacities: {
        small: { max: newLoc.smallCap, occupied: 0 },
        medium: { max: newLoc.mediumCap, occupied: 0 },
        large: { max: newLoc.largeCap, occupied: 0 }
      },
      mapPosition: { top: '50%', left: '50%' } // Defaultná pozícia na mape pre nové podniky
    };
    setLocations([...locations, loc]);
    setShowAddForm(false);
    setNewLoc({ name: '', address: '', smallCap: 10, mediumCap: 5, largeCap: 2 });
  };

  // Výpočet celkového počtu odložených batožín pre rýchle štatistiky
  const totalOccupied = locations.reduce((acc, loc) => 
    acc + loc.capacities.small.occupied + loc.capacities.medium.occupied + loc.capacities.large.occupied, 0
  );

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex flex-col p-6">
      <header className="mb-8 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" /> Admin Panel
          </h1>
          <p className="text-gray-500 font-medium text-sm">Správa podnikov a kapacít</p>
        </div>
      </header>

      {/* Rýchle štatistiky */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-1"><Store className="w-5 h-5" /></div>
          <div className="text-2xl font-black">{locations.length}</div>
          <div className="text-sm font-bold text-gray-400 uppercase">Podnikov</div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-1"><Activity className="w-5 h-5" /></div>
          <div className="text-2xl font-black">{totalOccupied}</div>
          <div className="text-sm font-bold text-gray-400 uppercase">Odložených batožín</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Zoznam podnikov</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Pridať podnik
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold mb-4">Nový podnik</h3>
          <input type="text" placeholder="Názov (napr. Kaviareň)" value={newLoc.name} onChange={(e) => setNewLoc({...newLoc, name: e.target.value})} className="w-full p-3 rounded-xl border mb-3 bg-gray-50 outline-none focus:border-black" />
          <input type="text" placeholder="Adresa" value={newLoc.address} onChange={(e) => setNewLoc({...newLoc, address: e.target.value})} className="w-full p-3 rounded-xl border mb-4 bg-gray-50 outline-none focus:border-black" />
          
          <h4 className="text-sm font-bold text-gray-500 mb-2">Maximálna kapacita miest:</h4>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Briefcase className="w-3 h-3"/> Malé</span>
              <input type="number" min="0" value={newLoc.smallCap} onChange={(e) => setNewLoc({...newLoc, smallCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-bold" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Luggage className="w-3 h-3"/> Stredné</span>
              <input type="number" min="0" value={newLoc.mediumCap} onChange={(e) => setNewLoc({...newLoc, mediumCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-bold" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><Package className="w-3 h-3"/> Veľké</span>
              <input type="number" min="0" value={newLoc.largeCap} onChange={(e) => setNewLoc({...newLoc, largeCap: parseInt(e.target.value) || 0})} className="w-full p-2 text-center rounded-lg border font-bold" />
            </div>
          </div>

          <button onClick={handleAddLocation} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">
            Uložiť podnik
          </button>
        </div>
      )}

      {/* Zoznam podnikov so zobrazením nových kapacít */}
      <div className="space-y-4">
        {locations.map(loc => {
          const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
          const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
          const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
          const isCompletelyFull = sFree === 0 && mFree === 0 && lFree === 0;

          return (
            <div key={loc.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{loc.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc.address}</p>
                </div>
                {isCompletelyFull ? (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Plné</span>
                ) : (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider">Aktívne</span>
                )}
              </div>

              {/* Ukazovatele kapacít */}
              <div className="grid grid-cols-3 gap-2">
                {/* Malé batožiny */}
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{loc.capacities.small.occupied}/{loc.capacities.small.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${sFree === 0 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${loc.capacities.small.max === 0 ? 0 : (loc.capacities.small.occupied / loc.capacities.small.max) * 100}%` }}></div>
                  </div>
                </div>

                {/* Stredné batožiny */}
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <Luggage className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{loc.capacities.medium.occupied}/{loc.capacities.medium.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${mFree === 0 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${loc.capacities.medium.max === 0 ? 0 : (loc.capacities.medium.occupied / loc.capacities.medium.max) * 100}%` }}></div>
                  </div>
                </div>

                {/* Veľké batožiny */}
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{loc.capacities.large.occupied}/{loc.capacities.large.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${lFree === 0 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${loc.capacities.large.max === 0 ? 0 : (loc.capacities.large.occupied / loc.capacities.large.max) * 100}%` }}></div>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </main>
  );
}