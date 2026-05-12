'use client';

import { ArrowLeft, ShieldCheck, CreditCard, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-black p-6 md:p-12 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-8 font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Späť na rezerváciu
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-2 rounded-xl text-white">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Všeobecné obchodné podmienky</h1>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
            1. Definície
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li><strong>Docenta SPACES:</strong> Platforma sprostredkovávajúca úschovu batožiny.</li>
            <li><strong>Zákazník:</strong> Osoba využívajúca služby platformy na rezerváciu úschovy.</li>
            <li><strong>Partner:</strong> Prevádzka (kaviareň, hotel, obchod), kde sa batožina fyzicky uschováva.</li>
            <li><strong>Rezervácia:</strong> Záväzný záujem o úschovu vytvorený a zaplatený cez platformu.</li>
          </ul>
        </section>

        <section className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
          <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-orange-900">
            <Clock className="w-5 h-5" /> 2. Pravidlá a 4-hodinový limit
          </h2>
          <p className="text-orange-800 font-medium">
            Vytvorením rezervácie vám Partner blokuje obmedzenú kapacitu. Ste povinný/á odovzdať batožinu <strong>do 4 hodín</strong> od vytvorenia rezervácie. Po uplynutí tohto času systém rezerváciu miesta automaticky zruší, aby uvoľnil kapacitu iným záujemcom. V prípade neskorého príchodu nie je možné garantovať voľné miesto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" /> 3. Platobné podmienky
          </h2>
          <p className="text-gray-600">
            Cena za službu úschovy je splatná vopred pri vytvorení rezervácie. 
            <strong> Platba prebieha online prostredníctvom platobnej brány Comgate</strong>. 
            Rezervácia je platná až po úspešnom spracovaní platby. 
          </p>
          <p className="text-gray-600 mt-2">
            Poskytovateľom platobnej brány je spoločnosť Comgate, a.s. Citlivé údaje z vašej karty sú spracovávané výhradne v zabezpečenom prostredí brány a Docenta SPACES k nim nemá prístup.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> 4. Zakázané predmety
          </h2>
          <p className="text-gray-600 mb-2">V úschovniach Docenta SPACES je prísne zakázané uschovávať:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>Zbrane, horľaviny, výbušniny a nebezpečné chemické látky.</li>
            <li>Hotovosť, drahé kovy, šperky a cenné papiere.</li>
            <li>Osobné doklady (pasy, občianske preukazy).</li>
            <li>Živé zvieratá a potraviny podliehajúce skaze.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Zákazník súhlasí s odfotografovaním batožiny prostredníctvom aplikácie na účely identifikácie a bezpečnosti.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black uppercase tracking-tight mb-4">5. Zodpovednosť</h2>
          <p className="text-gray-600">
            Docenta SPACES nenesie zodpovednosť za cennosti uložené v rozpore s bodom 4. Zodpovednosť za batožinu preberá Partner v momente fyzického prevzatia a potvrdenia kódu v systéme.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Posledná aktualizácia: Máj 2026</p>
        </section>
      </div>
    </main>
  );
}