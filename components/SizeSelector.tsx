'use client';
import { useState } from 'react';
import { Briefcase, Luggage, Package, Plus, Minus, CalendarDays } from 'lucide-react';
import { Location } from './LocationSelector';

const SIZES = [
  { id: 'small', label: 'Malá batožina', price: 2, icon: Briefcase, desc: 'Kabelka, malý batoh' },
  { id: 'medium', label: 'Stredná batožina', price: 3, icon: Luggage, desc: 'Palubný kufor, veľký batoh' },
  { id: 'large', label: 'Veľká batožina', price: 4, icon: Package, desc: 'Veľký cestovný kufor' },
];

export type SelectedLuggage = { id: string; typeId: string; label: string; price: number };

type Props = {
  location: Location;
  onNext: (items: SelectedLuggage[], days: number, totalPrice: number) => void;
};

export default function SizeSelector({ location, onNext }: Props) {
  const [counts, setCounts] = useState<{ [key: string]: number }>({ small: 0, medium: 0, large: 0 });
  const [days, setDays] = useState(1);

  const totalItemsCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPrice = SIZES.reduce((total, size) => total + (counts[size.id] * size.price), 0) * days;

  // Pomocná funkcia na získanie dostupnej kapacity pre konkrétnu veľkosť
  const getAvailableForSize = (sizeId: string) => {
    const cap = location.capacities[sizeId as keyof typeof location.capacities];
    return cap.max - cap.occupied;
  };

  const updateCount = (id: string, delta: number) => {
    const available = getAvailableForSize(id);
    if (delta > 0 && counts[id] >= available) return; // Nemôže prekročiť kapacitu pre danú veľkosť
    setCounts(prev => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
  };

  const handleContinue = () => {
    const items: SelectedLuggage[] = [];
    SIZES.forEach(size => {
      for (let i = 0; i < counts[size.id]; i++) {
        items.push({ id: `${size.id}-${i}-${Date.now()}`, typeId: size.id, label: size.label, price: size.price });
      }
    });
    onNext(items, days, totalPrice);
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-2 text-gray-800">Čo si chceš odložiť?</h3>
      <p className="text-sm text-gray-500 mb-6">Vyber si počet kusov. Zobrazujeme len aktuálne voľné kapacity podniku.</p>
      
      <div className="space-y-3 mb-6">
        {SIZES.map((size) => {
          const Icon = size.icon;
          const count = counts[size.id];
          const available = getAvailableForSize(size.id);
          const isMaxReached = count >= available;

          return (
            <div key={size.id} className={`p-4 rounded-2xl border-2 transition-all ${count > 0 ? 'border-black bg-gray-50' : available === 0 ? 'border-red-100 bg-red-50 opacity-60' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${count > 0 ? 'bg-black text-white' : available === 0 ? 'bg-red-200 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{size.label}</div>
                    <div className="text-sm font-medium text-gray-500">{size.price}€ / deň</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => updateCount(size.id, -1)} disabled={count === 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30">
                    <Minus className="w-4 h-4 text-black" />
                  </button>
                  <span className="font-bold w-4 text-center">{count}</span>
                  <button 
                    onClick={() => updateCount(size.id, 1)} 
                    disabled={isMaxReached}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${isMaxReached ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-black text-white active:scale-90'}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Informácia o voľných miestach pod položkou */}
              <div className={`mt-2 text-xs font-bold uppercase tracking-wider text-right ${available === 0 ? 'text-red-500' : 'text-green-600'}`}>
                {available === 0 ? 'Plná kapacita' : `Voľné: ${available} / ${location.capacities[size.id as keyof typeof location.capacities].max}`}
              </div>
            </div>
          );
        })}
      </div>
      
      <h3 className="text-xl font-bold mb-4 text-gray-800">Na ako dlho?</h3>
      <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-white mb-6">
        <div className="flex items-center gap-3"><CalendarDays className="w-6 h-6 text-gray-400" /><span className="font-bold text-gray-800">Počet dní</span></div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDays(Math.max(1, days - 1))} disabled={days === 1} className="w-10 h-10 rounded-full border-2 flex items-center justify-center disabled:opacity-30"><Minus className="w-5 h-5 text-black" /></button>
          <span className="font-bold text-xl w-6 text-center">{days}</span>
          <button onClick={() => setDays(days + 1)} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center active:scale-90"><Plus className="w-5 h-5" /></button>
        </div>
      </div>
      
      {totalItemsCount > 0 && (
        <button onClick={handleContinue} className="w-full bg-black text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform flex justify-between px-6">
          <span>Pokračovať k údajom</span><span>{totalPrice}€</span>
        </button>
      )}
    </div>
  );
}