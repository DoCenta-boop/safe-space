'use client';

import { useState, useEffect } from "react";
import { MapPin, Plus, ArrowLeft, Briefcase, Luggage, Package, Loader2 } from "lucide-react";
import LocationSelector, { Location } from "../components/LocationSelector";
import SizeSelector, { SelectedLuggage } from "../components/SizeSelector";
import UserDetailsForm from "../components/UserDetailsForm";
import CameraCapture from "../components/CameraCapture";
import ReservationTicket from "../components/ReservationTicket";
import { createBooking, getLocations } from "../lib/bookingService";

export default function Home() {
  const [step, setStep] = useState(0); 
  const [locations, setLocations] = useState<Location[]>([]); 
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedLuggage[]>([]);
  const [bookingDays, setBookingDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [capturedImages, setCapturedImages] = useState<{id: string, image: string}[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await getLocations();
      if (result.success && result.data) {
        const activeLocations = (result.data as any[]).filter(loc => loc.isActive !== false);
        setLocations(activeLocations);
      }
      setIsLoadingLocations(false);
    }
    loadData();
  }, []);

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

  const handlePaymentAndBooking = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);

    try {
      const result = await createBooking(
        {
          userName: userData.name,
          userEmail: userData.email,
          userPhone: userData.phone,
          items: selectedItems,
          totalPrice: totalPrice,
          locationId: selectedLocation.id,
        },
        capturedImages 
      );

      if (result.success && result.bookingId) {
        setBookingId(result.bookingId);
        setStep(6);
      } else {
        alert("Chyba pri ukladaní rezervácie. Skontrolujte pripojenie.");
      }
    } catch (error) {
      console.error(error);
      alert("Vyskytla sa chyba. Skúste to znova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- VÝPOČET ZHRNUTIA BATOŽINY ---
  // Toto zoskupí vybrané položky a vytvorí textový reťazec, napr. "1x Malá batožina, 2x Veľká batožina"
  const luggageSummary = Object.entries(
    selectedItems.reduce((acc, item) => {
      acc[item.label] = (acc[item.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([label, count]) => `${count}x ${label}`).join(', ');

  return (
    <main className="relative h-[100dvh] w-full bg-gray-100 flex flex-col overflow-hidden font-sans text-black">
      <div className="flex-1 relative bg-[#e5e3df] overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        
        {!isLoadingLocations && locations.map((loc) => {
          const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
          const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
          const lFree = loc.capacities.large.max - loc.capacities.large.occupied;

          return (
            <div key={loc.id} className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full" style={{ top: loc.mapPosition.top, left: loc.mapPosition.left }}>
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-gray-100 mb-2 flex gap-3 text-xs whitespace-nowrap animate-in fade-in zoom-in duration-500 delay-150">
                <div className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-gray-400"/> <span className={`font-black ${sFree>0 ? 'text-green-600':'text-red-500'}`}>{sFree}/{loc.capacities.small.max}</span></div>
                <div className="flex items-center gap-1"><Luggage className="w-3 h-3 text-gray-400"/> <span className={`font-black ${mFree>0 ? 'text-green-600':'text-red-500'}`}>{mFree}/{loc.capacities.medium.max}</span></div>
                <div className="flex items-center gap-1"><Package className="w-3 h-3 text-gray-400"/> <span className={`font-black ${lFree>0 ? 'text-green-600':'text-red-500'}`}>{lFree}/{loc.capacities.large.max}</span></div>
              </div>
              <div className={`p-2 rounded-full shadow-md text-white ${selectedLocation?.id === loc.id ? 'bg-blue-600 scale-110' : 'bg-black'} transition-all shadow-xl`}>
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 w-full max-h-[90dvh] overflow-y-auto bg-white p-6 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] pb-10 transition-all duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shrink-0"></div>
        
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black mb-2 text-black tracking-tight">Kam s batožinou?</h2>
            <p className="text-gray-500 mb-8 font-bold">Vyberte si miesto na mape a bezpečne si odložte veci.</p>
            
            <button 
              onClick={() => setStep(1)} 
              disabled={isLoadingLocations || locations.length === 0}
              className="w-full bg-black text-white font-black text-lg py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-black/10 disabled:bg-gray-400"
            >
              {isLoadingLocations ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Načítavam...</>
              ) : locations.length === 0 ? (
                "Momentálne nemáme voľné podniky"
              ) : (
                <><Plus className="w-7 h-7" /> Nová rezervácia</>
              )}
            </button>
          </div>
        )}

        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-black transition-colors font-black uppercase text-[10px] tracking-[0.2em]">
            <ArrowLeft className="w-4 h-4" /> Späť
          </button>
        )}

        {step === 1 && <div className="animate-in fade-in"><LocationSelector locations={locations} onSelect={handleLocationSelect} /></div>}
        {step === 2 && selectedLocation && <div className="animate-in fade-in"><SizeSelector location={selectedLocation} onNext={handleSizeSelection} /></div>}
        
        {step === 3 && (
          <div className="animate-in fade-in">
            <UserDetailsForm 
              onNext={(data) => { 
                setUserData(data); 
                setCapturedImages([]); 
                setCurrentPhotoIndex(0); 
                setStep(4); 
              }} 
              onBack={() => setStep(2)}
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
            <h2 className="text-3xl font-black mb-2 text-black tracking-tight">Skoro hotovo!</h2>
            <p className="text-gray-500 mb-8 font-bold text-sm">Skontrolujte údaje a potvrďte rezerváciu.</p>
            
            <div className="bg-gray-50 p-6 rounded-[2rem] w-full mb-8 text-left border-2 border-gray-100 shadow-inner">
              <div className="flex justify-between mb-4"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Miesto</span><span className="font-black text-black text-right">{selectedLocation?.name}</span></div>
              {/* TU UKAZUJEME ROZPIS BATOŽINY NAMIESTO IBA KUSOV */}
              <div className="flex justify-between mb-4"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Batožina</span><span className="font-black text-black text-right">{luggageSummary}</span></div>
              <div className="flex justify-between pt-5 border-t-2 border-gray-100 mt-2"><span className="text-black font-black uppercase text-[10px] tracking-widest">Celkom</span><span className="font-black text-3xl text-black">{totalPrice} €</span></div>
            </div>

            <button 
              onClick={handlePaymentAndBooking} 
              disabled={isSubmitting}
              className="w-full bg-black text-white font-black text-lg py-6 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:bg-gray-400 shadow-2xl shadow-black/20"
            >
              {isSubmitting ? (
                <><Loader2 className="w-7 h-7 animate-spin" /> Ukladám...</>
              ) : (
                "Potvrdiť rezerváciu"
              )}
            </button>
          </div>
        )}

        {step === 6 && bookingId && (
          <div className="animate-in fade-in">
            {/* POSIELAME ROZPIS BATOŽINY DO LÍSTKA */}
            <ReservationTicket bookingId={bookingId} userName={userData.name} size={luggageSummary} userEmail={userData.email} />
            <button onClick={() => window.location.reload()} className="w-full mt-8 py-5 bg-gray-50 font-black rounded-2xl text-gray-400 active:text-black transition-all uppercase tracking-[0.2em] text-[10px]">Späť na mapu</button>
          </div>
        )}
      </div>
    </main>
  );
}