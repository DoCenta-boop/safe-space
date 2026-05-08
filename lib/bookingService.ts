import { db } from './firebase';
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

export async function createBooking(bookingData: any) {
  try {
    // GENERÁTOR: Úplne náhodných 6 znakov (čísla + písmená)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let shortId = '';
    for (let i = 0; i < 6; i++) {
      shortId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      bookingId: shortId, // Ukladáme čistý 6-miestny kód
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });

    return { success: true, bookingId: shortId, firestoreId: docRef.id };
  } catch (error) {
    console.error("Chyba pri ukladaní:", error);
    return { success: false, error };
  }
}

// Funkcia na hľadanie zostáva rovnaká, len bude hľadať presný 6-miestny kód
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