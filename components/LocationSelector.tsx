'use client';
import { MapPin, Store, Briefcase, Luggage, Package } from 'lucide-react';

export type SizeCapacity = { max: number; occupied: number };
export type Location = { 
  id: string; 
  name: string; 
  address: string; 
  capacities: { small: SizeCapacity; medium: SizeCapacity; large: SizeCapacity };
  mapPosition: { top: string; left: string }; // Pre simuláciu mapy
};

export const MOCK_LOCATIONS: Location[] = [
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

type Props = {
  onSelect: (location: Location) => void;
};

export default function LocationSelector({ onSelect }: Props) {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-2 text-gray-800">Dostupné podniky v okolí</h3>
      <p className="text-gray-500 text-sm mb-6">Vyber si miesto pre svoju batožinu.</p>
      
      <div className="space-y-3">
        {MOCK_LOCATIONS.map((loc) => {
          const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
          const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
          const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
          const isCompletelyFull = sFree === 0 && mFree === 0 && lFree === 0;

          return (
            <button
              key={loc.id}
              onClick={() => !isCompletelyFull && onSelect(loc)}
              disabled={isCompletelyFull}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 ${
                isCompletelyFull ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'bg-white border-gray-100 active:border-black active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isCompletelyFull ? 'bg-gray-200 text-gray-400' : 'bg-black text-white'}`}>
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{loc.name}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {loc.address}
                  </p>
                </div>
              </div>

              {/* Ukazovateľ kapacít podniku */}
              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className={`font-bold ${sFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{sFree}/{loc.capacities.small.max}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Luggage className="w-4 h-4 text-gray-400" />
                  <span className={`font-bold ${mFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{mFree}/{loc.capacities.medium.max}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className={`font-bold ${lFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{lFree}/{loc.capacities.large.max}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}