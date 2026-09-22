"use client";

import { useActionState } from "react";
import { connexionAction } from "./actions";

const COMPTES_DEMO = [
  { role: "Administrateur plateforme", email: "admin.demo@pitilink.local" },
  { role: "Administrateur plateforme", email: "admin.demo@pitilink.local" },
  { role: "Direction", email: "direction.demo@pitilink.local" },
  { role: "Responsable", email: "responsable.demo@pitilink.local" },
  { role: "Professionnel", email: "ana.demo@pitilink.local" },
  { role: "Parent", email: "parent.demo@pitilink.local" },
];

export default function ConnexionPage() {
  const [state, formAction, pending] = useActionState(connexionAction, { erreur: null });

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-600">PitiLink</h1>
          <p className="mt-1 text-stone-600">Suivi et communication garderie ↔ parents</p>
        </div>

        <form action={formAction} className="card space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-large"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input-large"
              placeholder="••••••••"
            />
          </div>

          {state.erreur && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.erreur}</p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="card space-y-2 text-sm text-stone-500">
          <p className="font-medium text-stone-700">Comptes de démonstration</p>
          <p>Mot de passe : <span className="font-mono">Password123!</span></p>
          <ul className="space-y-1">
            {COMPTES_DEMO.map((c) => (
              <li key={c.email} className="flex justify-between">
                <span>{c.role}</span>
                <span className="font-mono">{c.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
