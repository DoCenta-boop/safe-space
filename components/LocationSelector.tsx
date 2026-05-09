'use client';
import { MapPin, Store, Briefcase, Luggage, Package } from 'lucide-react';

export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; 
  name: string; 
  address: string; 
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; 
};

type Props = {
  locations: Location[];
  onSelect: (location: Location) => void;
};

export default function LocationSelector({ locations, onSelect }: Props) {
  if (!locations || locations.length === 0) {
    return <div className="p-4 text-center text-gray-500 font-bold">Žiadne dostupné podniky.</div>;
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-black mb-2 text-black">Dostupné podniky v okolí</h3>
      <p className="text-gray-500 text-sm mb-6 font-bold">Vyber si miesto pre svoju batožinu.</p>
      
      <div className="space-y-3">
        {locations.map((loc) => {
          const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
          const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
          const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
          const isCompletelyFull = sFree === 0 && mFree === 0 && lFree === 0;

          return (
            <button
              key={loc.id}
              onClick={() => !isCompletelyFull && onSelect(loc)}
              disabled={isCompletelyFull}
              className={`w-full text-left p-4 rounded-[1.5rem] border-2 transition-all flex flex-col gap-3 ${
                isCompletelyFull ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'bg-white border-gray-100 active:border-black active:scale-[0.98] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-[1rem] ${isCompletelyFull ? 'bg-gray-200 text-gray-400' : 'bg-black text-white shadow-md'}`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-black text-lg">{loc.name}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {loc.address}
                  </p>
                </div>
              </div>

              {/* Ukazovateľ kapacít podniku */}
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 mt-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className={`font-black ${sFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{sFree}/{loc.capacities.small.max}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Luggage className="w-4 h-4 text-gray-400" />
                  <span className={`font-black ${mFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{mFree}/{loc.capacities.medium.max}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className={`font-black ${lFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{lFree}/{loc.capacities.large.max}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}