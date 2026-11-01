"use client";

import { useFormStatus } from "react-dom";

/**
 * Bouton de soumission qui se désactive pendant l'envoi du formulaire parent.
 * Évite qu'une double touche enregistre deux pointages (deux événements au journal).
 */
export function BoutonEnvoi({
  className,
  ariaLabel,
  libelleEnCours = "⏳ Envoi…",
  children,
}: {
  className?: string;
  ariaLabel?: string;
  libelleEnCours?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} aria-label={ariaLabel} disabled={pending} aria-busy={pending}>
      {pending ? <span>{libelleEnCours}</span> : children}
    </button>
  );
}
