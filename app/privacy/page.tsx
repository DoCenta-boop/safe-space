'use client';

import { ArrowLeft, Lock, EyeOff, UserCheck, Share2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-black p-6 md:p-12 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-8 font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Späť na rezerváciu
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-black p-2 rounded-xl text-white">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Ochrana osobných údajov</h1>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-sm md:text-base leading-relaxed text-gray-600">
        <section>
          <h2 className="text-xl font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" /> 1. Spracovávané údaje
          </h2>
          <p>Zbierame len tie údaje, ktoré sú nevyhnutné pre poskytnutie služby úschovy:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Identifikačné údaje:</strong> Meno a priezvisko.</li>
            <li><strong>Kontaktné údaje:</strong> E-mail a telefónne číslo (na zaslanie lístka a overenie).</li>
            <li><strong>Obrazové dáta:</strong> Fotografie batožiny (na účely bezpečnej identifikácie pri výdaji).</li>
            <li><strong>Lokalita:</strong> Poloha zariadenia (ak je povolená) na zobrazenie najbližších podnikov.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" /> 2. Príjemcovia údajov
          </h2>
          <p>Vaše údaje zdieľame len s nevyhnutnými partnermi:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Zmluvný Partner:</strong> Prevádzka, u ktorej si batožinu ukladáte (dostane prístup k menu, kódu a fotkám).</li>
            <li><strong>Comgate, a.s.:</strong> Sprostredkovateľ platobnej brány na účely spracovania vašej platby.</li>
            <li><strong>Google Firebase:</strong> Poskytovateľ zabezpečenej cloudovej infraštruktúry.</li>
          </ul>
        </section>

        <section className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <h2 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-4 flex items-center gap-2">
            <EyeOff className="w-5 h-5" /> 3. Retencia a mazanie dát
          </h2>
          <p className="text-blue-800 font-medium leading-relaxed">
            Súkromie je našou prioritou. <strong>Fotografie vašej batožiny sú automaticky a natrvalo vymazané</strong> z našich serverov najneskôr do <strong>14 dní</strong> po ukončení alebo zrušení rezervácie. Kontaktné údaje uchovávame len po dobu nevyhnutnú podľa účtovných predpisov.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-black uppercase tracking-tight mb-4">4. Vaše práva</h2>
          <p>
            V zmysle nariadenia GDPR máte právo požadovať prístup k svojim údajom, ich opravu, vymazanie alebo prenos k inému poskytovateľovi. V prípade otázok nás neváhajte kontaktovať.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Docenta SPACES • 2026</p>
        </section>
      </div>
    </main>
  );
}