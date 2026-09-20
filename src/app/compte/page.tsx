"use client";

import { useActionState } from "react";
import { changerMotDePasse } from "@/app/actions";

export default function ComptePage() {
  const [state, formAction, pending] = useActionState(changerMotDePasse, { erreur: null, succes: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mon compte</h1>

      <form action={formAction} className="card space-y-3">
        <p className="font-semibold">Changer mon mot de passe</p>

        <div>
          <label className="mb-1 block text-sm text-stone-600" htmlFor="ancienMotDePasse">
            Mot de passe actuel
          </label>
          <input id="ancienMotDePasse" name="ancienMotDePasse" type="password" required className="input-large" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600" htmlFor="nouveauMotDePasse">
            Nouveau mot de passe
          </label>
          <input id="nouveauMotDePasse" name="nouveauMotDePasse" type="password" required minLength={8} className="input-large" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600" htmlFor="confirmation">
            Confirmer le nouveau mot de passe
          </label>
          <input id="confirmation" name="confirmation" type="password" required minLength={8} className="input-large" />
        </div>

        {state.erreur && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.erreur}</p>}
        {state.succes && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ✓ Mot de passe mis à jour.
          </p>
        )}

        <button disabled={pending} className="btn-primary w-full">
          {pending ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
