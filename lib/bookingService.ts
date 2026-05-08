import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function createBooking(bookingData: {
  userName: string;
  userEmail: string;
  items: any[];
  totalPrice: number;
  locationId: string;
}) {
  try {
    // Vygenerujeme 6-miestny kód (PB + 4 náhodné znaky)
    const shortId = "PB-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const docRef = await addDoc(collection(db, "bookings"), {
      ...bookingData,
      bookingId: shortId, // Toto je ten kód, ktorý uvidí admin/partner
      status: 'PENDING',
      createdAt: serverTimestamp(),
    });

    return { success: true, bookingId: shortId, firestoreId: docRef.id };
  } catch (error) {
    console.error("Chyba pri ukladaní rezervácie:", error);
    return { success: false, error };
  }
}