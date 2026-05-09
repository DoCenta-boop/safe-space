import { db, storage } from './firebase'; 
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit,
  updateDoc,
  doc 
} from 'firebase/firestore';
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