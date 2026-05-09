'use client';

import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Briefcase, Luggage, Package, Loader2, Navigation, Plus } from "lucide-react";
import LocationSelector, { Location } from "../components/LocationSelector";
import SizeSelector, { SelectedLuggage } from "../components/SizeSelector";
import UserDetailsForm from "../components/UserDetailsForm";
import CameraCapture from "../components/CameraCapture";
import ReservationTicket from "../components/ReservationTicket";
import { createBooking, getLocations } from "../lib/bookingService";

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export default function Home() {
  const [step, setStep] = useState(0); 
  const [locations, setLocations] = useState<any[]>([]); 
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locatingError, setLocatingError] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
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
        setLocations((result.data as any[]).filter(loc => loc.isActive !== false));
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

  const sortedLocations = [...locations].map(loc => {
    let distance = null;
    if (userLocation && loc.lat && loc.lng) {
      distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
    }
    return { ...loc, distance };
  }).sort((a, b) => (a.distance || 9999) - (b.distance || 9999));

  return (
    <main className="min-h-[100dvh] w-full bg-gray-50 flex flex-col font-sans text-black">
      
      {/* HLAVIČKA */}
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
        
        {/* KROK 0 */}
        {step === 0 && (
          <div className="animate-in fade-in w-full">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Kam s batožinou?</h2>
            <p className="text-gray-500 mb-6 font-bold text-sm">Vyberte si z našich overených podnikov a odložte si veci v bezpečí.</p>
            
            {locatingError && <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl text-xs font-bold mb-6 border border-orange-100">Poloha nie je povolená. Podniky sú zoradené náhodne. Pre zobrazenie vzdialeností povoľte GPS.</div>}
            
            {isLoadingLocations ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400"/></div>
            ) : locations.length === 0 ? (
              <div className="text-center py-10 font-bold text-gray-400">Momentálne nemáme voľné podniky.</div>
            ) : (
              <div className="space-y-6">
                {sortedLocations.map(loc => {
                  const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
                  const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
                  const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
                  const totalFree = sFree + mFree + lFree;

                  return (
                    <div key={loc.id} className="bg-white p-5 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col overflow-hidden w-full">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                          <h3 className="font-black text-xl mb-1 leading-tight">{loc.name}</h3>
                          <p className="text-xs text-gray-400 font-bold flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0"/> <span>{loc.address}</span></p>
                        </div>
                        {loc.distance !== null && (
                          <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 shrink-0">
                            <Navigation className="w-3 h-3" /> {(loc.distance < 1) ? `${Math.round(loc.distance * 1000)} m` : `${loc.distance.toFixed(1)} km`}
                          </div>
                        )}
                      </div>

                      {/* MAPA */}
                      {loc.lat && loc.lng && (
                        <div className="w-full h-32 md:h-40 mb-4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative pointer-events-auto">
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
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Malá</span><span className={`font-black text-sm ${sFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{sFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Stredná</span><span className={`font-black text-sm ${mFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{mFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-xl"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">Veľká</span><span className={`font-black text-sm ${lFree > 0 ? 'text-green-600' : 'text-red-500'}`}>{lFree}</span></div>
                      </div>

                      <div className="mt-auto">
                        <button onClick={() => handleLocationSelect(loc)} disabled={totalFree === 0} className="w-full bg-black text-white font-black py-4 md:py-5 rounded-2xl text-sm md:text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 shadow-xl shadow-black/20">
                          Zvoliť toto miesto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KROKY 2 AŽ 5 */}
        <div className="w-full">
          {step === 2 && selectedLocation && <div className="animate-in fade-in"><SizeSelector location={selectedLocation} onNext={handleSizeSelection} /></div>}
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
                  <div className="flex justify-between items-center"><span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Doba</span><span className="font-black text-sm md:text-base">{bookingDays} {bookingDays === 1 ? 'deň' : bookingDays < 5 ? 'dni' : 'dní'}</span></div>
                </div>
                
                <div className="flex justify-between items-center pt-5 border-t-2 border-gray-100 mt-5">
                  <span className="text-black font-black uppercase text-[10px] tracking-widest">Celkom</span>
                  <span className="font-black text-3xl text-blue-600">{totalPrice} €</span>
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

          {/* KROK 6: LÍSTOK */}
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

        {/* PÄTIČKA ZÁKAZNÍKA */}
        {!bookingId && (
          <div className="mt-12 w-full text-center pb-4">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Powered by Docenta</p>
          </div>
        )}
      </div>
    </main>
  );
}