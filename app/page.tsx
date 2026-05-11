'use client';

import { useState, useEffect } from "react";
// Pridal som ikonku 'Clock'
import { MapPin, ArrowLeft, Briefcase, Luggage, Package, Loader2, Navigation, Plus, Search, Clock } from "lucide-react";
import LocationSelector, { Location } from "../components/LocationSelector";
import SizeSelector, { SelectedLuggage } from "../components/SizeSelector";
import UserDetailsForm from "../components/UserDetailsForm";
import CameraCapture from "../components/CameraCapture";
import ReservationTicket from "../components/ReservationTicket";
import { createBooking, getLocations, getPricingConfig } from "../lib/bookingService";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// LOGIKA KONTROLY ČASU
const checkIsOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return true; // Ak nie sú nastavené časy, predpokladáme že je otvorené non-stop
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  if (closeMin <= openMin) {
      // Prevádzka je otvorená cez polnoc (napr. 20:00 do 02:00)
      return currentMinutes >= openMin || currentMinutes < closeMin;
  }
  return currentMinutes >= openMin && currentMinutes < closeMin;
};

export default function Home() {
  const [step, setStep] = useState(0); 
  const [locations, setLocations] = useState<any[]>([]); 
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locatingError, setLocatingError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'nearest' | 'availability'>('nearest');

  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedLuggage[]>([]);
  const [bookingDays, setBookingDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [capturedImages, setCapturedImages] = useState<{id: string, image: string}[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState({ small: 2, medium: 3, large: 4 });

  useEffect(() => {
    async function loadData() {
      const [locResult, priceResult] = await Promise.all([getLocations(), getPricingConfig()]);
      if (locResult.success && locResult.data) {
        setLocations((locResult.data as any[]).filter(loc => loc.isActive !== false));
      }
      if (priceResult.success && priceResult.data) {
        setPricing(priceResult.data as any);
      }
      setIsLoadingLocations(false);
    }
    loadData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => { setLocatingError(true); }
      );
    }
  }, []);

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setStep(2);
  };

  const handleSizeSelection = (items: SelectedLuggage[], days: number, price: number) => {
    setSelectedItems(items); setBookingDays(days); setTotalPrice(price); setStep(3);
  };

  const handlePhotoCaptured = (imageStr: string) => {
    const newImages = [...capturedImages, { id: selectedItems[currentPhotoIndex].id, image: imageStr }];
    setCapturedImages(newImages);
    if (currentPhotoIndex < selectedItems.length - 1) { setCurrentPhotoIndex(currentPhotoIndex + 1); } else { setStep(5); }
  };

  const handlePaymentAndBooking = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);
    try {
      const result = await createBooking({
        userName: userData.name, userEmail: userData.email, userPhone: userData.phone,
        items: selectedItems, totalPrice: totalPrice, locationId: selectedLocation.id, bookingDays: bookingDays, 
      }, capturedImages);
      if (result.success && result.bookingId) { setBookingId(result.bookingId); setStep(6); }
    } catch (error) { alert("Chyba pri ukladaní."); } finally { setIsSubmitting(false); }
  };

  const luggageSummary = Object.entries(selectedItems.reduce((acc, item) => { acc[item.label] = (acc[item.label] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([label, count]) => `${count}x ${label}`).join(', ');

  // KOMBINOVANÉ SPRACOVANIE
  const finalLocations = [...locations]
    .filter(loc => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q);
    })
    .map(loc => {
      let distance = null;
      if (userLocation && loc.lat && loc.lng) {
        distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
      }
      
      const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
      const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
      const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
      const totalFree = sFree + mFree + lFree;
      
      // VYHODNOTENIE OTVÁRACÍCH HODÍN PRE KAŽDÝ PODNIK
      const isOpen = checkIsOpen(loc.openingHours?.open, loc.openingHours?.close);
      const openText = loc.openingHours?.open ? `${loc.openingHours.open} - ${loc.openingHours.close}` : 'Non-stop';

      return { ...loc, distance, sFree, mFree, lFree, totalFree, isOpen, openText };
    })
    .sort((a, b) => {
      if (sortBy === 'availability') {
        return b.totalFree - a.totalFree;
      } else {
        return (a.distance || 9999) - (b.distance || 9999); 
      }
    });

  return (
    <main className="min-h-[100dvh] w-full bg-gray-50 flex flex-col font-sans text-black">
      
      <div className="bg-white p-6 pt-10 shadow-sm z-10 shrink-0 relative">
        <div className="flex items-center justify-center">
          <span className="text-3xl md:text-4xl font-black text-[#0f172a] tracking-tighter">Docenta</span>
          <span className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter ml-1.5">SPACES</span>
        </div>
        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step === 1 ? 0 : step - 1)} className="absolute left-4 md:left-6 top-1/2 mt-2 -translate-y-1/2 flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-black uppercase text-[10px] tracking-[0.2em]">
            <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Späť</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 w-full max-w-lg mx-auto">
        
        {step === 0 && (
          <div className="animate-in fade-in w-full">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Kam s batožinou?</h2>
            <p className="text-gray-500 mb-6 font-bold text-sm">Vyberte si z našich overených podnikov a odložte si veci v bezpečí.</p>
            
            {locatingError && <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-xs font-bold mb-6 border border-orange-100">Poloha nie je povolená. Podniky sú zoradené náhodne. Pre zobrazenie vzdialeností povoľte GPS.</div>}

            {!isLoadingLocations && locations.length > 0 && (
              <div className="mb-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-[1.5rem] text-sm md:text-base font-bold text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors shadow-sm"
                    placeholder="Hľadať názov alebo adresu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setSortBy('nearest')}
                    className={`flex-1 py-3.5 px-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sortBy === 'nearest' ? 'bg-black text-white shadow-lg shadow-black/20' : 'bg-white text-gray-400 border-2 border-gray-100 hover:text-black hover:border-black'}`}
                  >
                    <MapPin className="w-4 h-4" /> Najbližšie
                  </button>
                  <button
                    onClick={() => setSortBy('availability')}
                    className={`flex-1 py-3.5 px-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sortBy === 'availability' ? 'bg-black text-white shadow-lg shadow-black/20' : 'bg-white text-gray-400 border-2 border-gray-100 hover:text-black hover:border-black'}`}
                  >
                    <Package className="w-4 h-4" /> Voľné miesto
                  </button>
                </div>
              </div>
            )}
            
            {isLoadingLocations ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400"/></div>
            ) : finalLocations.length === 0 ? (
              <div className="text-center py-10 font-bold text-gray-400 bg-white border-2 border-dashed border-gray-200 rounded-[2rem]">
                <p>Nenašli sa žiadne podniky.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {finalLocations.map(loc => {
                  return (
                    <div key={loc.id} className="bg-white p-5 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col overflow-hidden w-full">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                          <h3 className="font-black text-xl mb-1 leading-tight">{loc.name}</h3>
                          <p className="text-xs text-gray-400 font-bold flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0"/> <span>{loc.address}</span></p>
                          
                          {/* VIZUÁL PRE OTVÁRACIE HODINY */}
                          <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${loc.isOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            <Clock className="w-3 h-3" />
                            {loc.isOpen ? 'Otvorené' : 'Zatvorené'} • {loc.openText}
                          </div>

                        </div>
                        {loc.distance !== null && (
                          <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 shrink-0">
                            <Navigation className="w-3 h-3" /> {(loc.distance < 1) ? `${Math.round(loc.distance * 1000)} m` : `${loc.distance.toFixed(1)} km`}
                          </div>
                        )}
                      </div>

                      {loc.lat && loc.lng && (
                        <div className="w-full h-32 md:h-40 mb-4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative pointer-events-auto mt-2">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&hl=sk&z=15&output=embed`}
                          ></iframe>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Malá</span><span className={`font-black text-sm ${loc.sFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{loc.sFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Stredná</span><span className={`font-black text-sm ${loc.mFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{loc.mFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Veľká</span><span className={`font-black text-sm ${loc.lFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{loc.lFree}</span></div>
                      </div>

                      <div className="mt-auto">
                        {/* ZABLOKOVANIE TLAČIDLA AK JE ZATVORENÉ */}
                        <button onClick={() => handleLocationSelect(loc)} disabled={loc.totalFree === 0 || !loc.isOpen} className={`w-full font-black py-4 md:py-5 rounded-2xl text-sm md:text-base flex items-center justify-center gap-2 transition-all ${loc.totalFree === 0 || !loc.isOpen ? 'bg-gray-200 text-gray-400 opacity-60 cursor-not-allowed' : 'bg-black text-white active:scale-95 shadow-xl shadow-black/20'}`}>
                          {loc.totalFree === 0 ? 'Plná kapacita' : !loc.isOpen ? 'Aktuálne zatvorené' : 'Zvoliť toto miesto'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KROKY 2 AŽ 6 ZOSTÁVAJÚ ROVNAKÉ */}
        <div className="w-full">
          {step === 2 && selectedLocation && <div className="animate-in fade-in"><SizeSelector location={selectedLocation} pricing={pricing} onNext={handleSizeSelection} /></div>}
          {step === 3 && <div className="animate-in fade-in"><UserDetailsForm onNext={(data) => { setUserData(data); setCapturedImages([]); setCurrentPhotoIndex(0); setStep(4); }} onBack={() => setStep(2)} /></div>}
          {step === 4 && <div className="animate-in fade-in"><CameraCapture key={`cam-${currentPhotoIndex}`} title={`Odfotografuj: ${selectedItems[currentPhotoIndex].label}`} onCapture={handlePhotoCaptured} onCancel={() => setStep(3)} /></div>}
          
          {step === 5 && (
            <div className="animate-in fade-in flex flex-col items-center text-center w-full">
              <h2 className="text-3xl font-black mb-2 text-black tracking-tight">Skoro hotovo!</h2>
              <p className="text-gray-500 mb-8 font-bold text-sm">Skontrolujte si prosím svoje údaje.</p>
              
              <div className="bg-white p-6 rounded-[2rem] w-full mb-8 text-left border-2 border-gray-100 shadow-xl">
                <div className="mb-4 pb-4 border-b-2 border-gray-100 space-y-3">
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Meno</span><span className="font-black text-sm md:text-base text-right">{userData.name}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Telefón</span><span className="font-black text-sm md:text-base text-right">{userData.phone || '-'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">E-mail</span><span className="font-black text-sm md:text-base text-right truncate pl-4">{userData.email || '-'}</span></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Miesto</span><span className="font-black text-sm md:text-base text-right max-w-[60%]">{selectedLocation?.name}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Batožina</span><span className="font-black text-sm md:text-base text-right max-w-[60%] leading-tight">{luggageSummary}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Doba</span><span className="font-black text-sm md:text-base text-blue-600">24 hodín</span></div>
                </div>
                
                <div className="flex justify-between items-center pt-5 border-t-2 border-gray-100 mt-5">
                  <span className="text-black font-black uppercase text-[10px] tracking-widest">Celkom</span>
                  <span className="font-black text-3xl text-blue-600">{totalPrice.toFixed(2)} €</span>
                </div>
              </div>

              <button 
                onClick={handlePaymentAndBooking} 
                disabled={isSubmitting}
                className="w-full bg-black text-white font-black text-lg py-5 md:py-6 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:bg-gray-400 shadow-xl shadow-black/20"
              >
                {isSubmitting ? <><Loader2 className="w-7 h-7 animate-spin" /> Ukladám...</> : "Potvrdiť rezerváciu"}
              </button>
            </div>
          )}

          {step === 6 && bookingId && (
            <div className="animate-in fade-in w-full">
              <ReservationTicket 
                bookingId={bookingId} userName={userData.name} size={luggageSummary} userEmail={userData.email} userPhone={userData.phone} days={bookingDays}
                mapsLink={selectedLocation?.mapsLink} 
              />
              <button 
                onClick={() => window.location.reload()} 
                className="w-full mt-8 py-5 bg-white font-black rounded-2xl text-gray-500 border-2 border-gray-100 active:bg-gray-50 transition-all uppercase tracking-[0.2em] text-[10px]"
              >
                Nová rezervácia
              </button>
            </div>
          )}
        </div>

        {!bookingId && (
          <div className="mt-12 w-full text-center pb-4">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Powered by Docenta</p>
          </div>
        )}
      </div>
    </main>
  );
}