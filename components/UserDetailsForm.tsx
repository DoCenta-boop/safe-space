'use client';
import { useState } from 'react';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';

type Props = {
  onNext: (data: { name: string; email: string; phone: string }) => void;
  onBack: () => void;
};

export default function UserDetailsForm({ onNext, onBack }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false); // STAV PRE SÚHLAS

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed) {
      // Posunieme údaje do hlavnej stránky a ideme na fotenie
      onNext({ name, email, phone });
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-black mb-2 text-black font-sans">Vaše údaje</h3>
      <p className="text-gray-500 mb-8 font-medium">Zadajte údaje pre vašu rezerváciu.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            required
            type="text"
            placeholder="Meno a priezvisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-black transition-all font-bold text-black"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-black transition-all font-bold text-black"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            required
            type="tel"
            placeholder="Telefónne číslo"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-black transition-all font-bold text-black"
          />
        </div>

        {/* PRIDANÝ CHECKBOX PRE PODMIENKY */}
        <div className="flex items-start gap-3 py-4 px-2">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-1 w-5 h-5 accent-black cursor-pointer shrink-0"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="terms" className="text-[11px] leading-relaxed text-gray-500 font-medium cursor-pointer">
            Potvrdením súhlasím so <a href="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">Všeobecnými obchodnými podmienkami</a> a beriem na vedomie <a href="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">Zásady ochrany osobných údajov</a>.
          </label>
        </div>

        <button
          type="submit"
          disabled={!name || !email || !phone || !agreed}
          className="w-full bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 mt-2 disabled:opacity-30 disabled:active:scale-100 active:scale-95"
        >
          Pokračovať k odfoteniu <ArrowRight className="w-5 h-5" />
        </button>
        
        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-400 font-bold py-2 hover:text-black transition-colors text-sm uppercase tracking-widest mt-2"
        >
          Späť
        </button>
      </form>
    </div>
  );
}