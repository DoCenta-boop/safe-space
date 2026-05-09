'use server';

// Direktíva 'use server' zaručuje, že tento kód sa nikdy nedostane do prehliadača, 
// ale spustí sa výlučne na tvojom bezpečnom serveri.

export async function verifyAdmin(usernameInput: string, passwordInput: string) {
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    console.error("POZOR: Chýbajú prístupové údaje v .env.local súbore!");
    return false;
  }

  // Porovnáme zadané údaje so skutočnými údajmi zo servera
  if (usernameInput === validUser && passwordInput === validPass) {
    return true;
  }
  
  return false;
}