"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// L'API Web Speech n'a pas (encore) de types officiels dans lib.dom : on ne
// déclare que le strict nécessaire, plutôt que `any`.
type ReconnaissanceVocale = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type FenetreAvecDictee = Window & {
  SpeechRecognition?: new () => ReconnaissanceVocale;
  webkitSpeechRecognition?: new () => ReconnaissanceVocale;
};

function supporteDictee() {
  if (typeof window === "undefined") return false;
  const fenetre = window as FenetreAvecDictee;
  return !!(fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition);
}

// Le support de la dictée ne change jamais en cours de session : rien à
// écouter, juste un instantané côté client (false côté serveur).
function sAbonnerJamais() {
  return () => {};
}

/**
 * Textarea avec dictée vocale optionnelle (🎙️), pour les professionnelles
 * pressées : dictée native du navigateur (Web Speech API), sans dépendance
 * ni appel serveur. Le bouton n'apparaît que si le navigateur la supporte
 * (Chrome/Edge essentiellement) — dégradation silencieuse sinon.
 */
export function ChampDictee({
  name,
  placeholder,
  rows = 2,
  defaultValue = "",
}: {
  name: string;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  const zoneRef = useRef<HTMLTextAreaElement>(null);
  const reconnaissanceRef = useRef<ReconnaissanceVocale | null>(null);
  const [enCours, setEnCours] = useState(false);
  const disponible = useSyncExternalStore(sAbonnerJamais, supporteDictee, () => false);

  useEffect(() => {
    if (!disponible) return;
    const fenetre = window as FenetreAvecDictee;
    const Constructeur = fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition;
    if (!Constructeur) return;

    const reconnaissance = new Constructeur();
    reconnaissance.lang = "fr-FR";
    reconnaissance.continuous = false;
    reconnaissance.interimResults = false;
    reconnaissance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((resultat) => resultat[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const zone = zoneRef.current;
      if (zone && transcript) {
        zone.value = zone.value ? `${zone.value} ${transcript}` : transcript;
      }
    };
    reconnaissance.onerror = () => setEnCours(false);
    reconnaissance.onend = () => setEnCours(false);
    reconnaissanceRef.current = reconnaissance;

    return () => reconnaissance.stop();
  }, [disponible]);

  function basculerDictee() {
    const reconnaissance = reconnaissanceRef.current;
    if (!reconnaissance) return;
    if (enCours) {
      reconnaissance.stop();
      setEnCours(false);
    } else {
      reconnaissance.start();
      setEnCours(true);
    }
  }

  return (
    <div className="space-y-1">
      <textarea ref={zoneRef} name={name} rows={rows} defaultValue={defaultValue} className="input-large" placeholder={placeholder} />
      {disponible && (
        <button
          type="button"
          onClick={basculerDictee}
          className={`text-xs font-medium ${enCours ? "text-red-600" : "text-orange-600"}`}
        >
          {enCours ? "🔴 Dictée en cours — toucher pour arrêter" : "🎙️ Dicter l'observation"}
        </button>
      )}
    </div>
  );
}
