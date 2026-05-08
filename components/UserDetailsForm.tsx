'use client';
import { useState } from 'react';
import { User, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { createBooking } from '../lib/bookingService'; // Importujeme tvoju novú službu

type Props = {
  items: any[];
  totalPrice: number;
  locationId: string;
  onSuccess: (bookingId: string, name: string, email: string) => void;
  onBack: () => void;
};

export default function UserDetailsForm({ items, totalPrice, locationId, onSuccess, onBack }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);

    // VOLANIE DATABÁZY
    const result = await createBooking({
      userName: name,
      userEmail: email,
      items: items,
      totalPrice: totalPrice,
      locationId: locationId
    });

    setIsSubmitting(false);

    if (result.success && result.bookingId) {
      // Ak sa podarilo uložiť, posunieme sa na zobrazenie lístka s reálnym ID
      onSuccess(result.bookingId, name, email);
    } else {
      alert('Chyba pri vytváraní rezervácie. Skúste to znova.');
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-black mb-2 text-black font-sans">Posledný krok</h3>
      <p className="text-gray-500 mb-8 font-medium">Zadajte údaje pre vašu rezerváciu.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              required
              type="text"
              placeholder="Vaše meno"
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
              placeholder="Váš e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-black transition-all font-bold text-black"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start border border-blue-100">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            Vaša batožina je u nás v bezpečí a poistená do výšky 500€. Platba prebehne až pri odovzdaní v podniku.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Vytváram rezerváciu...
              </>
            ) : (
              'Rezervovať bezpečné miesto'
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-gray-400 font-bold py-2 hover:text-black transition-colors text-sm uppercase tracking-widest"
          >
            Späť na výber batožiny
          </button>
        </div>
      </form>
    </div>
  );
}