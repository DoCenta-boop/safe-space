import { db, storage } from './firebase'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage'; 

// --- FUNKCIE PRE REZERVÁCIE ---

export async function createBooking(bookingData: any, capturedImages: {id: string, image: string}[]) {
  try {
    // 1. GENERÁTOR KÓDU (6 znakov)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let shortId = '';
    for (let i = 0; i < 6; i++) {
      shortId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 2. NAHRATIE FOTIEK DO STORAGE
    const uploadedImageUrls = [];
    
    if (capturedImages && capturedImages.length > 0) {
      for (let i = 0; i < capturedImages.length; i++) {
        const imgData = capturedImages[i];
        
        // Vytvoríme referenciu (cestu) v Storage, napr: bookings/X7K2P9/photo_0.jpg
        const imageRef = ref(storage, `bookings/${shortId}/photo_${i}.jpg`);
        
        // Nahráme fotku (imgData.image je base64 reťazec z kamery)
        await uploadString(imageRef, imgData.image, 'data_url');
        
        // Získame verejnú URL adresu k práve nahratej fotke
        const downloadURL = await getDownloadURL(imageRef);
        uploadedImageUrls.push(downloadURL);
      }
    }

    // 3. ULOŽENIE REZERVÁCIE DO DATABÁZY
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      bookingId: shortId,
      images: uploadedImageUrls, // Tu priradíme tie URL adresy z cloudu
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });

    return { success: true, bookingId: shortId, firestoreId: docRef.id };
  } catch (error) {
    console.error("Chyba pri ukladaní:", error);
    return { success: false, error };
  }
}

export async function getBookingByCode(code: string) {
  try {
    const q = query(
      collection(db, "bookings"), 
      where("bookingId", "==", code.toUpperCase()), 
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return { success: false };
    const bookingDoc = querySnapshot.docs[0];
    return { success: true, data: { id: bookingDoc.id, ...bookingDoc.data() } };
  } catch (error) {
    return { success: false };
  }
}

export async function updateBookingStatus(docId: string, newStatus: string) {
  try {
    await updateDoc(doc(db, "bookings", docId), { status: newStatus });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// --- FUNKCIE PRE PODNIKY (LOCATIONS) ---

export async function addLocation(locationData: any) {
  try {
    // Generovanie 6-miestneho PINu (iba čísla) pre partner login
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Generovanie unikátneho URL slugu (bez diakritiky, medzery na pomlčky + náhodné znaky)
    const baseSlug = locationData.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Odstráni diakritiku
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') // Nahradí medzery a znaky pomlčkami
      .replace(/-+/g, '-') // Odstráni viacero pomlčiek za sebou
      .replace(/^-|-$/g, ''); // Odstráni pomlčky na začiatku a konci
    
    // Pridáme 6 náhodných znakov pre absolútnu unikátnosť
    const randomChars = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomChars}`;

    const newDoc = {
      ...locationData,
      pin: pin,
      slug: slug, // Uložíme vygenerovaný slug do databázy
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "locations"), newDoc);
    
    return { 
      success: true, 
      id: docRef.id,
      pin: pin,
      slug: slug // Vraciame slug späť pre zobrazenie v Admine
    };
  } catch (error) {
    console.error("Chyba pri pridávaní podniku:", error);
    return { success: false, error };
  }
}

export async function getLocations() {
  try {
    const q = query(collection(db, "locations"));
    const querySnapshot = await getDocs(q);
    
    const locations: any[] = [];
    querySnapshot.forEach((doc) => {
      locations.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: locations };
  } catch (error) {
    console.error("Chyba pri načítavaní podnikov:", error);
    return { success: false, data: [] };
  }
}

// Nová funkcia na načítanie konkrétneho podniku podľa URL slugu
export async function getLocationBySlug(slug: string) {
  try {
    const q = query(collection(db, "locations"), where("slug", "==", slug), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return { success: false };
    
    const doc = querySnapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error("Chyba pri načítavaní podniku podľa slugu:", error);
    return { success: false };
  }
}
// --- FUNKCIA PRE AKTÍVNE REZERVÁCIE PARTNERA ---
export async function getActiveBookingsForLocation(locationId: string) {
    try {
      // Stiahneme rezervácie len pre konkrétny podnik
      const q = query(
        collection(db, "bookings"), 
        where("locationId", "==", locationId)
      );
      const querySnapshot = await getDocs(q);
      
      const activeBookings: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Vyfiltrujeme len tie, ktoré ešte nie sú COMPLETED (Ukončené)
        if (data.status === 'PENDING' || data.status === 'STORED') {
          activeBookings.push({ id: doc.id, ...data });
        }
      });
  
      // Zoradíme ich tak, aby najnovšie boli hore
      activeBookings.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      return { success: true, data: activeBookings };
    } catch (error) {
      console.error("Chyba pri načítavaní aktívnych rezervácií:", error);
      return { success: false, data: [] };
    }
  }
  // --- FUNKCIA PRE ADMIN ŠTATISTIKY ---
export async function getAllBookings() {
    try {
      const q = query(collection(db, "bookings"));
      const querySnapshot = await getDocs(q);
      
      const bookings: any[] = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: bookings };
    } catch (error) {
      console.error("Chyba pri načítavaní všetkých rezervácií:", error);
      return { success: false, data: [] };
    }
  }
  // --- FUNKCIE PRE ÚPRAVU A MAZANIE PODNIKOV ---

export async function updateLocationData(id: string, updateData: any) {
    try {
      const locRef = doc(db, "locations", id);
      await updateDoc(locRef, updateData);
      return { success: true };
    } catch (error) {
      console.error("Chyba pri úprave podniku:", error);
      return { success: false, error };
    }
  }
  
  export async function deleteLocationData(id: string) {
    try {
      await deleteDoc(doc(db, "locations", id));
      return { success: true };
    } catch (error) {
      console.error("Chyba pri mazaní podniku:", error);
      return { success: false, error };
    }
  }
  
  export async function resetLocationPin(id: string) {
    try {
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      await updateDoc(doc(db, "locations", id), { pin: newPin });
      return { success: true, newPin };
    } catch (error) {
      console.error("Chyba pri resete PINu:", error);
      return { success: false, error };
    }
  }// --- PAUZA / AKTIVÁCIA PODNIKU ---
export async function toggleLocationActive(id: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, "locations", id), { isActive: !currentStatus });
      return { success: true };
    } catch (error) {
      console.error("Chyba pri zmene statusu podniku:", error);
      return { success: false, error };
    }
  }
  
  // --- STORNO REZERVÁCIE ---
  export async function cancelBookingStatus(id: string) {
    try {
      await updateDoc(doc(db, "bookings", id), { status: 'CANCELLED' });
      return { success: true };
    } catch (error) {
      console.error("Chyba pri stornovaní:", error);
      return { success: false, error };
    }
  }
  
  // --- CENNÍK (GLOBÁLNE NASTAVENIA) ---
  export async function getPricingConfig() {
    try {
      const docSnap = await getDoc(doc(db, "settings", "pricing"));
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        // Ak cenník ešte neexistuje, vytvoríme predvolený
        const defaultPricing = { small: 5, medium: 7, large: 10 };
        await setDoc(doc(db, "settings", "pricing"), defaultPricing);
        return { success: true, data: defaultPricing };
      }
    } catch (error) {
      console.error("Chyba pri načítaní cenníka:", error);
      return { success: false, data: { small: 5, medium: 7, large: 10 } }; // Fallback
    }
  }
  
  export async function updatePricingConfig(prices: { small: number, medium: number, large: number }) {
    try {
      await setDoc(doc(db, "settings", "pricing"), prices);
      return { success: true };
    } catch (error) {
      console.error("Chyba pri ukladaní cien:", error);
      return { success: false, error };
    }
  }
  // --- LIVE FUNKCIA NA AKTÍVNE REZERVÁCIE (BEZ REFRESHU) ---
import { onSnapshot } from 'firebase/firestore'; // Pridaj onSnapshot do importov úplne hore, ak tam nie je!

export function listenToActiveBookings(locationId: string, callback: (bookings: any[]) => void) {
  const q = query(
    collection(db, "bookings"),
    where("locationId", "==", locationId),
    where("status", "in", ["PENDING", "STORED"])
  );

  // Vytvoríme aktívny "poslucháč" na zmeny v databáze.
  // Akonáhle sa niečo zmení (pridá nová, zmení status, zmaže), zavolá sa táto funkcia.
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const activeBookings: any[] = [];
    querySnapshot.forEach((doc) => {
      activeBookings.push({ id: doc.id, ...doc.data() });
    });
    // Zoradíme podľa dátumu - najnovšie hore
    activeBookings.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    callback(activeBookings);
  }, (error) => {
    console.error("Chyba pri živom spojení:", error);
  });

  // Vrátime funkciu na zrušenie poslucháča (keď sa komponent odpojí)
  return unsubscribe;
}
// --- LIVE FUNKCIA PRE ADMINA (VŠETKY REZERVÁCIE) ---
export function listenToAllBookings(callback: (bookings: any[]) => void) {
    // Tu nefiltrujeme podľa locationId, ťaháme úplne všetko
    const q = query(collection(db, "bookings"));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allBookings: any[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() });
      });
      // Zoradíme od najnovších po najstaršie
      allBookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(allBookings);
    }, (error) => {
      console.error("Chyba pri živom spojení pre Admina:", error);
    });
  
    return unsubscribe;
  }