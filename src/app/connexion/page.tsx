"use client";

import { useActionState } from "react";
import { connexionAction, connexionRapideAction } from "./actions";

type CompteRapide = { role: string; prenom: string; email: string; icone: string };

const COMPTES_DEMO: CompteRapide[] = [
  { role: "Administrateur plateforme", prenom: "Admin", email: "admin.demo@pitilink.local", icone: "🛡️" },
  { role: "Direction", prenom: "Claire", email: "direction.demo@pitilink.local", icone: "📊" },
  { role: "Responsable", prenom: "Sophie", email: "responsable.demo@pitilink.local", icone: "📊" },
  { role: "Professionnel", prenom: "Ana", email: "ana.demo@pitilink.local", icone: "🧑‍🏫" },
  { role: "Professionnel", prenom: "Julie", email: "julie.demo@pitilink.local", icone: "🧑‍🏫" },
  { role: "Parent", prenom: "Léa", email: "parent.demo@pitilink.local", icone: "👶" },
  { role: "Parent", prenom: "Rudy", email: "papa.demo@pitilink.local", icone: "👶" },
];

const COMPTES_TEST: CompteRapide[] = [
  { role: "Parent de 2 enfants", prenom: "Test Parent", email: "test.parent@pitilink.local", icone: "👶" },
  { role: "Professionnelle très sollicitée", prenom: "Test Tatie", email: "test.tatie@pitilink.local", icone: "🧑‍🏫" },
  { role: "Direction", prenom: "Test Directrice", email: "test.directrice@pitilink.local", icone: "📊" },
];

function BoutonAccesRapide({ compte }: { compte: CompteRapide }) {
  return (
    <form action={connexionRapideAction.bind(null, compte.email)}>
      <button
        type="submit"
        className="flex w-full items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-left text-sm transition hover:bg-orange-50"
      >
        <span className="flex items-center gap-1.5">
          <span>{compte.icone}</span>
          <span>
            <span className="font-medium text-stone-700">{compte.prenom}</span>
            <span className="text-stone-400"> · {compte.role}</span>
            <span className="block font-mono text-xs text-stone-400">{compte.email}</span>
          </span>
        </span>
        <span className="text-orange-600">→</span>
      </button>
    </form>
  );
}

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

        <div className="card space-y-2">
          <p className="font-medium text-stone-700">⚡ Accès rapide — comptes de test</p>
          <p className="text-xs text-stone-400">Un clic, aucune saisie — pour tester l&apos;application rôle par rôle.</p>
          <div className="space-y-1">
            {COMPTES_TEST.map((c) => (
              <BoutonAccesRapide key={c.email} compte={c} />
            ))}
          </div>
        </div>

        <div className="card space-y-2">
          <p className="font-medium text-stone-700">Comptes de démonstration</p>
          <div className="space-y-1">
            {COMPTES_DEMO.map((c) => (
              <BoutonAccesRapide key={c.email} compte={c} />
            ))}
          </div>
          <p className="pt-1 text-xs text-stone-400">
            Mot de passe (connexion manuelle) : <span className="font-mono">Password123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
