import { NextResponse } from 'next/server';
import { cancelExpiredPendingBookings } from '../../../lib/bookingService';

// Vynútime, aby sa táto route ne-cáchovala (dôležité pre Next.js 13+)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Zavoláme našu novú funkciu z bookingService
    const result = await cancelExpiredPendingBookings();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Kontrola expirovaných rezervácií prebehla úspešne.', 
        canceledCount: result.canceledCount 
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Chyba pri stornovaní' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Interná chyba servera' }, { status: 500 });
  }
}