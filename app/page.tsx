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
    <main className="min-h-[100dvh] w-full bg-[#F9FAFB] flex flex-col font-sans text-gray-900 selection:bg-blue-100">
      
      {/* HLAVIČKA (Glassmorphism) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex flex-col shrink-0">
        <div className="flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Docenta</span>
          <span className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-tight ml-1.5">SPACES</span>
        </div>
        {step > 0 && step < 6 && (
          <button onClick={() => setStep(step === 1 ? 0 : step - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-20 relative">
        
        {/* KROK 0 */}
        {step === 0 && (
          <div className="animate-in fade-in max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-gray-900">Kam s batožinou?</h2>
            <p className="text-gray-500 mb-6 text-[15px] leading-relaxed">Vyberte si z našich overených podnikov a odložte si veci v bezpečí.</p>
            
            {locatingError && <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl text-sm mb-6 border border-amber-100">Poloha nie je povolená. Podniky sú zoradené náhodne. Pre zobrazenie vzdialeností povoľte GPS.</div>}
            
            {isLoadingLocations ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300"/></div>
            ) : locations.length === 0 ? (
              <div className="text-center py-10 font-medium text-gray-400">Momentálne nemáme voľné podniky.</div>
            ) : (
              <div className="space-y-5">
                {sortedLocations.map(loc => {
                  const sFree = loc.capacities.small.max - loc.capacities.small.occupied;
                  const mFree = loc.capacities.medium.max - loc.capacities.medium.occupied;
                  const lFree = loc.capacities.large.max - loc.capacities.large.occupied;
                  const totalFree = sFree + mFree + lFree;

                  return (
                    <div key={loc.id} className="bg-white p-5 sm:p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-2">
                          <h3 className="font-bold text-lg sm:text-xl mb-1 text-gray-900">{loc.name}</h3>
                          <p className="text-[13px] text-gray-500 font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> {loc.address}</p>
                        </div>
                        {loc.distance !== null && (
                          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold text-[11px] flex items-center gap-1 whitespace-nowrap">
                            <Navigation className="w-3 h-3" /> {(loc.distance < 1) ? `${Math.round(loc.distance * 1000)} m` : `${loc.distance.toFixed(1)} km`}
                          </div>
                        )}
                      </div>

                      {/* Responzívna mapa (aspect-video) */}
                      {loc.lat && loc.lng && (
                        <div className="w-full aspect-[21/9] sm:aspect-[16/6] mb-5 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative pointer-events-auto">
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
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-2xl"><span className="text-[10px] font-medium text-gray-400 mb-0.5">Malá</span><span className={`font-bold text-sm ${sFree > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{sFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-2xl"><span className="text-[10px] font-medium text-gray-400 mb-0.5">Stredná</span><span className={`font-bold text-sm ${mFree > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{mFree}</span></div>
                        <div className="flex flex-col items-center bg-gray-50 p-2 rounded-2xl"><span className="text-[10px] font-medium text-gray-400 mb-0.5">Veľká</span><span className={`font-bold text-sm ${lFree > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{lFree}</span></div>
                      </div>

                      <button onClick={() => handleLocationSelect(loc)} disabled={totalFree === 0} className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100">
                        Zvoliť tento podnik
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KROKY 2 AŽ 5 */}
        <div className="max-w-lg mx-auto">
          {step === 2 && selectedLocation && <div className="animate-in fade-in"><SizeSelector location={selectedLocation} onNext={handleSizeSelection} /></div>}
          {step === 3 && <div className="animate-in fade-in"><UserDetailsForm onNext={(data) => { setUserData(data); setCapturedImages([]); setCurrentPhotoIndex(0); setStep(4); }} onBack={() => setStep(2)} /></div>}
          {step === 4 && <div className="animate-in fade-in"><CameraCapture key={`cam-${currentPhotoIndex}`} title={`Odfotografuj: ${selectedItems[currentPhotoIndex].label}`} onCapture={handlePhotoCaptured} onCancel={() => setStep(3)} /></div>}
          
          {step === 5 && (
            <div className="animate-in fade-in flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 tracking-tight text-center">Skoro hotovo!</h2>
              <p className="text-gray-500 mb-8 text-[15px] text-center">Skontrolujte si prosím svoje údaje.</p>
              
              <div className="bg-white p-6 rounded-3xl w-full mb-6 text-left border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-[15px]">
                <div className="mb-4 pb-4 border-b border-gray-100 space-y-3">
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Meno</span><span className="font-semibold text-gray-900">{userData.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Telefón</span><span className="font-semibold text-gray-900">{userData.phone || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">E-mail</span><span className="font-semibold text-gray-900 truncate pl-4">{userData.email || '-'}</span></div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Miesto</span><span className="font-semibold text-gray-900 text-right">{selectedLocation?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Batožina</span><span className="font-semibold text-gray-900 text-right">{luggageSummary}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-medium">Doba</span><span className="font-semibold text-gray-900">{bookingDays} {bookingDays === 1 ? 'deň' : bookingDays < 5 ? 'dni' : 'dní'}</span></div>
                </div>
                
                <div className="flex justify-between pt-5 border-t border-gray-100 mt-5">
                  <span className="text-gray-900 font-medium">Celkom</span>
                  <span className="font-bold text-2xl text-blue-600">{totalPrice} €</span>
                </div>
              </div>

              <button 
                onClick={handlePaymentAndBooking} 
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white font-semibold text-[15px] py-4 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:bg-gray-300"
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Ukladám...</> : "Potvrdiť rezerváciu"}
              </button>
            </div>
          )}

          {/* KROK 6: LÍSTOK */}
          {step === 6 && bookingId && (
            <div className="animate-in fade-in">
              <ReservationTicket 
                bookingId={bookingId} userName={userData.name} size={luggageSummary} userEmail={userData.email} userPhone={userData.phone} days={bookingDays}
                mapsLink={selectedLocation?.mapsLink} 
              />
              <button 
                onClick={() => window.location.reload()} 
                className="w-full mt-6 py-4 bg-white font-semibold rounded-2xl text-gray-500 border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all text-[15px]"
              >
                Nová rezervácia
              </button>
            </div>
          )}
        </div>

        {/* PÄTIČKA ZÁKAZNÍKA */}
        {!bookingId && (
          <div className="mt-12 w-full text-center">
            <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">Powered by Docenta</p>
          </div>
        )}
      </div>
    </main>
  );
}