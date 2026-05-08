'use client';
import { Camera } from 'lucide-react';
import { useState } from 'react';

type UserData = { name: string; email: string; phone: string };

type Props = {
  totalItemsCount: number;
  onNext: (data: UserData) => void;
};

export default function UserDetailsForm({ totalItemsCount, onNext }: Props) {
  const [formData, setFormData] = useState<UserData>({ name: '', email: '', phone: '' });

  // Striktná validácia pomocou regulárnych výrazov (Regex)
  const isValidName = formData.name.trim().length > 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  // Telefón musí začínať + alebo číslom a mať 9 až 15 znakov bez písmen
  const isValidPhone = /^\+?[0-9\s]{9,15}$/.test(formData.phone);

  const isFormValid = isValidName && isValidEmail && isValidPhone;

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-6 text-gray-800">Tvoje údaje</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meno a priezvisko</label>
          <input 
            type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Napr. Ján Novák"
            className={`w-full p-4 rounded-2xl border-2 bg-gray-50 outline-none transition-all ${formData.name && !isValidName ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:bg-white focus:border-black'}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skutočný e-mail (pre potvrdenie)</label>
          <input 
            type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="jan.novak@email.sk"
            className={`w-full p-4 rounded-2xl border-2 bg-gray-50 outline-none transition-all ${formData.email && !isValidEmail ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:bg-white focus:border-black'}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefónne číslo</label>
          <input 
            type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="+421 900 000 000"
            className={`w-full p-4 rounded-2xl border-2 bg-gray-50 outline-none transition-all ${formData.phone && !isValidPhone ? 'border-red-300 focus:border-red-500' : 'border-gray-100 focus:bg-white focus:border-black'}`}
          />
        </div>
      </div>
      
      <button 
        disabled={!isFormValid} onClick={() => onNext(formData)}
        className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all ${
          isFormValid ? 'bg-black text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Camera className="w-5 h-5" />
        Odfotiť batožinu ({totalItemsCount}x)
      </button>
    </div>
  );
}