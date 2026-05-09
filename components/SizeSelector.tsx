'use client';

import { useState } from 'react';
import { Briefcase, Luggage, Package, Plus, Minus, CalendarDays } from 'lucide-react';
import { Location } from './LocationSelector';

const SIZES = [
  { 
    id: 'small', 
    label: 'Malá batožina', 
    price: 2, 
    icon: Briefcase, 
    desc: 'Batoh, kabelka, taška na notebook (max 40x30x20 cm)' 
  },
  { 
    id: 'medium', 
    label: 'Stredná batožina', 
    price: 3, 
    icon: Luggage, 
    desc: 'Palubný kufor, víkendová taška (max 55x40x20 cm)' 
  },
  { 
    id: 'large', 
    label: 'Veľká batožina', 
    price: 4, 
    icon: Package, 
    desc: 'Veľký kufor do podpalubia, turistické krosná' 
  },
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

  const getAvailableForSize = (sizeId: string) => {
    const cap = location.capacities[sizeId as keyof typeof location.capacities];
    return cap.max - cap.occupied;
  };

  const updateCount = (id: string, delta: number) => {
    const available = getAvailableForSize(id);
    if (delta > 0 && counts[id] >= available) return;
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
      <h3 className="text-3xl font-black mb-2 text-black font-sans tracking-tight">Čo si chceš odložiť?</h3>
      <p className="text-sm font-bold text-gray-500 mb-6 font-sans">Vyber si počet kusov. Zobrazujeme len aktuálne voľné kapacity.</p>
      
      <div className="space-y-4 mb-8">
        {SIZES.map((size) => {
          const Icon = size.icon;
          const count = counts[size.id];
          const available = getAvailableForSize(size.id);
          const isMaxReached = count >= available;

          return (
            <div key={size.id} className={`p-4 md:p-5 rounded-[2rem] border-2 transition-all ${count > 0 ? 'border-black bg-gray-50 shadow-lg' : available === 0 ? 'border-red-100 bg-red-50 opacity-60' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center justify-between font-sans gap-3">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl shrink-0 transition-colors ${count > 0 ? 'bg-black text-white' : available === 0 ? 'bg-red-200 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <div className="font-black text-lg md:text-xl text-black leading-tight">{size.label}</div>
                    {/* PRIDANÝ POPIS (DESC) */}
                    <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-1 mb-1.5 leading-snug pr-2">{size.desc}</div>
                    <div className="text-sm font-black text-blue-600">{size.price} € / deň</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <button onClick={() => updateCount(size.id, -1)} disabled={count === 0} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform">
                    <Minus className="w-4 h-4 md:w-5 md:h-5 text-black" />
                  </button>
                  <span className="font-black text-xl md:text-2xl text-black w-6 text-center">{count}</span>
                  <button onClick={() => updateCount(size.id, 1)} disabled={isMaxReached} className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-transform ${isMaxReached ? 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-black text-white active:scale-90 shadow-md shadow-black/20'}`}>
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
              <div className={`mt-3 text-[10px] font-black uppercase tracking-widest text-right ${available === 0 ? 'text-red-500' : 'text-green-600'}`}>
                {available === 0 ? 'Plná kapacita' : `Voľné: ${available} / ${location.capacities[size.id as keyof typeof location.capacities].max}`}
              </div>
            </div>
          );
        })}
      </div>
      
      <h3 className="text-xl font-black mb-4 text-black font-sans">Na ako dlho?</h3>
      <div className="flex items-center justify-between p-5 rounded-[2rem] border-2 border-gray-100 bg-white mb-8 shadow-sm">
        <div className="flex items-center gap-3 font-sans">
          <div className="p-3 rounded-xl bg-gray-50"><CalendarDays className="w-6 h-6 text-black" /></div>
          <span className="font-black text-black uppercase text-[10px] tracking-widest">Počet dní</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDays(Math.max(1, days - 1))} disabled={days === 1} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-200 flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"><Minus className="w-5 h-5 text-black" /></button>
          <span className="font-black text-3xl text-black w-8 text-center">{days}</span>
          <button onClick={() => setDays(days + 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black text-white flex items-center justify-center active:scale-90 shadow-md shadow-black/20 transition-transform"><Plus className="w-5 h-5" /></button>
        </div>
      </div>
      
      {totalItemsCount > 0 && (
        <button onClick={handleContinue} className="w-full bg-black text-white font-black py-5 md:py-6 rounded-2xl active:scale-95 transition-transform flex justify-between px-6 font-sans shadow-xl shadow-black/20 text-lg">
          <span>Pokračovať k údajom</span><span>{totalPrice} €</span>
        </button>
      )}
    </div>
  );
}