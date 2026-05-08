'use client';

import { useState } from "react";
import { MapPin, Plus, ArrowLeft, Briefcase, Luggage, Package, Loader2 } from "lucide-react";
import LocationSelector, { Location, MOCK_LOCATIONS } from "../components/LocationSelector";
import SizeSelector, { SelectedLuggage } from "../components/SizeSelector";
import UserDetailsForm from "../components/UserDetailsForm";
import CameraCapture from "../components/CameraCapture";
import ReservationTicket from "../components/ReservationTicket";
// 1. Importujeme službu pre zápis do DB
import { createBooking } from "../lib/bookingService";

export default function Home() {
  const [step, setStep] = useState(0); 
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedLuggage[]>([]);
  const [bookingDays, setBookingDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [capturedImages, setCapturedImages] = useState<{id: string, image: string}[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // 2. Stav pre načítavanie počas zápisu do DB
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setStep(2);
  };

  const handleSizeSelection = (items: SelectedLuggage[], days: number, price: number) => {
    setSelectedItems(items); 
    setBookingDays(days); 
    setTotalPrice(price); 
    setStep(3);
  };

  const handlePhotoCaptured = (imageStr: string) => {
    const newImages = [...capturedImages, { id: selectedItems[currentPhotoIndex].id, image: imageStr }];
    setCapturedImages(newImages);
    if (currentPhotoIndex < selectedItems.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else {
      setStep(5);
    }
  };

  // 3. UPRAVENÁ FUNKCIA: Teraz reálne ukladá do Firebase
  const handlePaymentAndBooking = async () => {
    if (!selectedLocation) return;

    setIsSubmitting(true);

    const result = await createBooking({
      userName: userData.name,
      userEmail: userData.email,
      items: selectedItems,
      totalPrice: totalPrice,
      locationId: selectedLocation.id,
      // Tu v ďalšom kroku pridáme aj nahratie fotiek do Storage
    });

    setIsSubmitting(false);

    if (result.success && result.bookingId) {
      setBookingId(result.bookingId);
      setStep(6);
    } else {
      alert("Nepodarilo sa vytvoriť rezerváciu. Skontrolujte pripojenie.");
    }
  };

  return (
    <main className="relative h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden font-sans">
      
      {/* MAPA A ŠPENDLÍKY (bezo zmeny) */}
      <div className="flex-1 relative bg-[#e5e3df] overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        
        {MOCK_LOCATIONS.map((loc) => {
          const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
          const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
          const lFree = loc.capacities.large.max - loc.capacities.large.occupied;

          return (
            <div key={loc.id} className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full" style={{ top: loc.mapPosition.top, left: loc.mapPosition.left }}>
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 mb-2 flex gap-3 text-xs whitespace-nowrap animate-in fade-in zoom-in duration-500 delay-150">
                <div className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400"/> <span className={`font-bold ${sFree>0 ? 'text-green-600':'text-red-500'}`}>{sFree}/{loc.capacities.small.max}</span></div>
                <div className="flex items-center gap-1"><Luggage className="w-3 h-3 text-gray-400"/> <span className={`font-bold ${mFree>0 ? 'text-green-600':'text-red-500'}`}>{mFree}/{loc.capacities.medium.max}</span></div>
                <div className="flex items-center gap-1"><Package className="w-3 h-3 text-gray-400"/> <span className={`font-bold ${lFree>0 ? 'text-green-600':'text-red-500'}`}>{lFree}/{loc.capacities.large.max}</span></div>
              </div>
              <div className={`p-2 rounded-full shadow-md text-white ${selectedLocation?.id === loc.id ? 'bg-blue-600 scale-110' : 'bg-black'} transition-all`}>
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* SPODNÝ PANEL */}
      <div className="absolute bottom-0 w-full max-h-[90dvh] overflow-y-auto bg-white p-6 rounded-t-[2rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] pb-8 transition-all duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0"></div>
        
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-black mb-2 text-black">Kam s batožinou?</h2>
            <p className="text-gray-500 mb-6 font-medium">Zvoľte si miesto na mape, ukážeme vám voľné kapacity.</p>
            <button onClick={() => setStep(1)} className="w-full bg-black text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl shadow-black/10">
              <Plus className="w-6 h-6" /> Nová rezervácia
            </button>
          </div>
        )}

        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-gray-400 mb-4 hover:text-black transition-colors font-bold uppercase text-xs tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Späť
          </button>
        )}

        {step === 1 && <div className="animate-in fade-in"><LocationSelector onSelect={handleLocationSelect} /></div>}
        
        {step === 2 && selectedLocation && <div className="animate-in fade-in"><SizeSelector location={selectedLocation} onNext={handleSizeSelection} /></div>}

        {step === 3 && (
          <div className="animate-in fade-in">
            <UserDetailsForm 
              totalItemsCount={selectedItems.length} 
              onNext={(data) => { 
                setUserData(data); 
                setCapturedImages([]); 
                setCurrentPhotoIndex(0); 
                setStep(4); 
              }} 
            />
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in">
            <CameraCapture 
              key={`cam-${currentPhotoIndex}`} 
              title={`Odfotografuj: ${selectedItems[currentPhotoIndex].label}`} 
              onCapture={handlePhotoCaptured} 
              onCancel={() => setStep(3)} 
            />
          </div>
        )}

        {step === 5 && (
          <div className="animate-in fade-in flex flex-col items-center text-center">
            <h2 className="text-2xl font-black mb-2 text-black">Skoro hotovo!</h2>
            <p className="text-gray-500 mb-6 font-medium">Skontrolujte si údaje pred potvrdením.</p>
            
            <div className="bg-gray-50 p-6 rounded-3xl w-full mb-8 text-left border border-gray-100">
              <div className="flex justify-between mb-3"><span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Miesto</span><span className="font-black text-black">{selectedLocation?.name}</span></div>
              <div className="flex justify-between mb-3"><span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Batožina</span><span className="font-black text-black">{selectedItems.length} ks</span></div>
              <div className="flex justify-between pt-4 border-t border-gray-200 mt-2"><span className="text-black font-black uppercase text-xs tracking-widest">Celková cena</span><span className="font-black text-2xl text-black">{totalPrice} €</span></div>
            </div>

            <button 
              onClick={handlePaymentAndBooking} 
              disabled={isSubmitting}
              className="w-full bg-black text-white font-black text-lg py-5 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:bg-gray-400 shadow-xl shadow-black/10"
            >
              {isSubmitting ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Vytváram rezerváciu...</>
              ) : (
                "Potvrdiť a rezervovať"
              )}
            </button>
          </div>
        )}

        {step === 6 && bookingId && (
          <div className="animate-in fade-in">
            <ReservationTicket bookingId={bookingId} userName={userData.name} size={`${selectedItems.length} ks`} userEmail={userData.email} />
            <button onClick={() => window.location.reload()} className="w-full mt-6 py-5 bg-gray-100 font-black rounded-2xl text-black active:scale-95 transition-transform uppercase tracking-widest text-sm">Späť na mapu</button>
          </div>
        )}
      </div>
    </main>
  );
}