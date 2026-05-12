import { db, storage } from './firebase'; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc, doc, deleteDoc, setDoc, getDoc, onSnapshot, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage'; 

// ==========================================
// 1. FUNKCIE PRE REZERVÁCIE
// ==========================================

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
        const imageRef = ref(storage, `bookings/${shortId}/photo_${i}.jpg`);
        await uploadString(imageRef, imgData.image, 'data_url');
        const downloadURL = await getDownloadURL(imageRef);
        uploadedImageUrls.push(downloadURL);
      }
    }

    // 3. VÝPOČET KAPACÍT BATOŽINY ZÁKAZNÍKA
    let sCount = 0, mCount = 0, lCount = 0;
    if (bookingData.items) {
      bookingData.items.forEach((item: any) => {
        const str = String(item.id || item.label).toLowerCase();
        if (str.includes('small') || str.includes('mal')) sCount++;
        else if (str.includes('medium') || str.includes('stred')) mCount++;
        else if (str.includes('large') || str.includes('vel') || str.includes('veľ')) lCount++;
      });
    }

    // 4. ULOŽENIE REZERVÁCIE DO DATABÁZY
    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      bookingId: shortId,
      images: uploadedImageUrls,
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });

    // 5. OBSADÍME MIESTA V PODNIKU (Zvýšime 'occupied' hodnotu)
    if (bookingData.locationId && (sCount > 0 || mCount > 0 || lCount > 0)) {
      await updateDoc(doc(db, "locations", bookingData.locationId), {
        "capacities.small.occupied": increment(sCount),
        "capacities.medium.occupied": increment(mCount),
        "capacities.large.occupied": increment(lCount)
      });
    }

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

export async function updateBookingStatus(id: string, status: string) {
  try {
    const updateData: any = { status };
    
    // Ak sa mení status na 'STORED' (Prevzaté personálom), uložíme presný čas začiatku
    if (status === 'STORED') {
      updateData.storedAt = serverTimestamp();
    }

    // Ak sa batožina vyzdvihla (COMPLETED), UVOĽNÍME MIESTO V PODNIKU
    if (status === 'COMPLETED') {
      const bookingDoc = await getDoc(doc(db, "bookings", id));
      if (bookingDoc.exists()) {
        const bData = bookingDoc.data();
        if (bData.locationId && bData.items) {
          let sCount = 0, mCount = 0, lCount = 0;
          bData.items.forEach((item: any) => {
            const str = String(item.id || item.label).toLowerCase();
            if (str.includes('small') || str.includes('mal')) sCount++;
            else if (str.includes('medium') || str.includes('stred')) mCount++;
            else if (str.includes('large') || str.includes('vel') || str.includes('veľ')) lCount++;
          });
          
          if (sCount > 0 || mCount > 0 || lCount > 0) {
            await updateDoc(doc(db, "locations", bData.locationId), {
              "capacities.small.occupied": increment(-sCount),
              "capacities.medium.occupied": increment(-mCount),
              "capacities.large.occupied": increment(-lCount)
            });
          }
        }
      }
    }
    
    await updateDoc(doc(db, "bookings", id), updateData);
    return { success: true };
  } catch (error) {
    console.error("Chyba pri úprave statusu:", error);
    return { success: false, error };
  }
}

export async function cancelBookingStatus(id: string) {
  try {
    // Ak zákazník stornuje, musíme tiež UVOĽNIŤ MIESTO V PODNIKU
    const bookingDoc = await getDoc(doc(db, "bookings", id));
    if (bookingDoc.exists()) {
      const bData = bookingDoc.data();
      if (bData.locationId && bData.items) {
        let sCount = 0, mCount = 0, lCount = 0;
        bData.items.forEach((item: any) => {
          const str = String(item.id || item.label).toLowerCase();
          if (str.includes('small') || str.includes('mal')) sCount++;
          else if (str.includes('medium') || str.includes('stred')) mCount++;
          else if (str.includes('large') || str.includes('vel') || str.includes('veľ')) lCount++;
        });

        if (sCount > 0 || mCount > 0 || lCount > 0) {
          await updateDoc(doc(db, "locations", bData.locationId), {
            "capacities.small.occupied": increment(-sCount),
            "capacities.medium.occupied": increment(-mCount),
            "capacities.large.occupied": increment(-lCount)
          });
        }
      }
    }

    await updateDoc(doc(db, "bookings", id), { status: 'CANCELLED' });
    return { success: true };
  } catch (error) {
    console.error("Chyba pri stornovaní:", error);
    return { success: false, error };
  }
}

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

export async function getActiveBookingsForLocation(locationId: string) {
  try {
    const q = query(collection(db, "bookings"), where("locationId", "==", locationId));
    const querySnapshot = await getDocs(q);
    
    const activeBookings: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'PENDING' || data.status === 'STORED') {
        activeBookings.push({ id: doc.id, ...data });
      }
    });

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


// ==========================================
// 2. FUNKCIE PRE PODNIKY (LOCATIONS)
// ==========================================

export async function addLocation(locationData: any) {
  try {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const baseSlug = locationData.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-') 
      .replace(/-+/g, '-') 
      .replace(/^-|-$/g, ''); 
    
    const randomChars = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomChars}`;

    const newDoc = {
      ...locationData,
      pin: pin,
      slug: slug, 
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "locations"), newDoc);
    
    return { success: true, id: docRef.id, pin: pin, slug: slug };
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
}

export async function toggleLocationActive(id: string, currentStatus: boolean) {
  try {
    await updateDoc(doc(db, "locations", id), { isActive: !currentStatus });
    return { success: true };
  } catch (error) {
    console.error("Chyba pri zmene statusu podniku:", error);
    return { success: false, error };
  }
}


// ==========================================
// 3. CENNÍK (GLOBÁLNE NASTAVENIA)
// ==========================================

export async function getPricingConfig() {
  try {
    const docSnap = await getDoc(doc(db, "settings", "pricing"));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      const defaultPricing = { small: 5, medium: 7, large: 10 };
      await setDoc(doc(db, "settings", "pricing"), defaultPricing);
      return { success: true, data: defaultPricing };
    }
  } catch (error) {
    console.error("Chyba pri načítaní cenníka:", error);
    return { success: false, data: { small: 5, medium: 7, large: 10 } }; 
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


// ==========================================
// 4. LIVE POSLUCHÁČE (REAL-TIME UPDATES)
// ==========================================

export function listenToActiveBookings(locationId: string, callback: (bookings: any[]) => void) {
  const q = query(
    collection(db, "bookings"),
    where("locationId", "==", locationId),
    where("status", "in", ["PENDING", "STORED"])
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const activeBookings: any[] = [];
    querySnapshot.forEach((doc) => {
      activeBookings.push({ id: doc.id, ...doc.data() });
    });
    // Bezpečné triedenie (ak by chýbal createdAt)
    activeBookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(activeBookings);
  }, (error) => {
    console.error("Chyba pri živom spojení pre partnera:", error);
  });

  return unsubscribe;
}

export function listenToAllBookings(callback: (bookings: any[]) => void) {
  const q = query(collection(db, "bookings"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const allBookings: any[] = [];
    querySnapshot.forEach((doc) => {
      allBookings.push({ id: doc.id, ...doc.data() });
    });
    // Bezpečné triedenie
    allBookings.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(allBookings);
  }, (error) => {
    console.error("Chyba pri živom spojení pre Admina:", error);
  });

  return unsubscribe;
}
// ==========================================
// 5. CRON JOBS A AUTOMATIZÁCIA
// ==========================================

export async function cancelExpiredPendingBookings() {
  try {
    // Vypočítame čas spred 4 hodín
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    // Nájdeme všetky rezervácie, ktoré sú PENDING a staršie ako 4 hodiny
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "PENDING"),
      where("createdAt", "<", fourHoursAgo)
    );

    const querySnapshot = await getDocs(q);
    let canceledCount = 0;

    // Postupne prejdeme každú expirovanú rezerváciu a stornujeme ju
    for (const docSnapshot of querySnapshot.docs) {
      // Použijeme už existujúcu funkciu, ktorá stornuje rezerváciu a zároveň UVOĽNÍ kapacitu podniku
      await cancelBookingStatus(docSnapshot.id);
      canceledCount++;
    }

    console.log(`Úspešne stornovaných ${canceledCount} expirovaných rezervácií.`);
    return { success: true, canceledCount };
  } catch (error) {
    console.error("Chyba pri hromadnom stornovaní expirovaných rezervácií:", error);
    return { success: false, error };
  }
}