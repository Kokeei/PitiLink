"use client";

import { useState } from "react";
import { JOURS_MENU } from "@/lib/menus";

type Etape = 1 | 2 | 3 | 4;

const ETAPES: { id: Etape; label: string }[] = [
  { id: 1, label: "Identité" },
  { id: 2, label: "Accueil" },
  { id: 3, label: "Responsables" },
  { id: 4, label: "Santé / sécurité" },
];

export function AssistantAjoutEnfant({
  action,
  groupes,
  allergenes,
}: {
  action: (formData: FormData) => void | Promise<void>;
  groupes: { id: string; nom: string }[];
  allergenes: { id: string; nom: string }[];
}) {
  const [etape, setEtape] = useState<Etape>(1);

  return (
    <form action={action} className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b border-stone-200">
        {ETAPES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEtape(e.id)}
            className={e.id === etape ? "tab-item-active" : "tab-item"}
          >
            {e.id}. {e.label}
          </button>
        ))}
      </div>

      <div className={etape === 1 ? "card space-y-3" : "hidden"}>
        <p className="font-semibold">Identité de l&apos;enfant</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="prenom" placeholder="Prénom" className="input-large" required />
          <input name="nom" placeholder="Nom" className="input-large" required />
          <label className="text-sm text-stone-600">
            Date de naissance
            <input name="dateNaissance" type="date" className="input-large mt-1" required />
          </label>
          <label className="text-sm text-stone-600">
            Sexe
            <select name="sexe" className="input-large mt-1" defaultValue="">
              <option value="">Non renseigné</option>
              <option value="FILLE">Fille</option>
              <option value="GARCON">Garçon</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-stone-400">
          Une photo pourra être ajoutée depuis la fiche, une fois l&apos;autorisation de diffusion renseignée.
        </p>
      </div>

      <div className={etape === 2 ? "card space-y-3" : "hidden"}>
        <p className="font-semibold">Accueil</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm text-stone-600">
            Date d&apos;entrée
            <input name="dateDebutAccueil" type="date" className="input-large mt-1" />
          </label>
          <label className="text-sm text-stone-600">
            Groupe
            <select name="groupeId" className="input-large mt-1" defaultValue="">
              <option value="">Sans groupe</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <p className="mb-1 text-sm text-stone-600">Jours de présence</p>
          <div className="flex flex-wrap gap-3">
            {JOURS_MENU.map((j) => (
              <label key={j} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="joursPresence" value={j} className="h-4 w-4" />
                {j}
              </label>
            ))}
          </div>
        </div>
        <input name="horaireHabituel" placeholder="Horaires habituels (ex. 07h30 - 18h30)" className="input-large" />
      </div>

      <div className={etape === 3 ? "card space-y-3" : "hidden"}>
        <p className="font-semibold">Responsable légal</p>
        <p className="text-xs text-stone-400">Facultatif à cette étape — un responsable pourra aussi être ajouté depuis la fiche.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="parentPrenom" placeholder="Prénom" className="input-large" />
          <input name="parentNom" placeholder="Nom" className="input-large" />
          <input name="parentTelephone" placeholder="Téléphone" className="input-large" />
          <select name="parentLien" className="input-large" defaultValue="AUTRE">
            <option value="MERE">Maman</option>
            <option value="PERE">Papa</option>
            <option value="TUTEUR">Tuteur / tutrice</option>
            <option value="AUTRE">Autre</option>
          </select>
          <input name="parentEmail" type="email" placeholder="Email (identifiant de connexion)" className="input-large sm:col-span-2" />
          <input
            name="parentMotDePasse"
            type="password"
            placeholder="Mot de passe initial"
            minLength={8}
            className="input-large sm:col-span-2"
          />
        </div>
      </div>

      <div className={etape === 4 ? "card space-y-4" : "hidden"}>
        <p className="font-semibold">Santé / sécurité</p>
        <p className="text-xs text-stone-400">Uniquement l&apos;essentiel — le reste se complète depuis l&apos;onglet Santé de la fiche.</p>

        {allergenes.length > 0 && (
          <div>
            <p className="mb-1 text-sm text-stone-600">Allergies</p>
            <div className="flex flex-wrap gap-3">
              {allergenes.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="allergeneIds" value={a.id} className="h-4 w-4" />
                  {a.nom}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <input name="traitementNom" placeholder="Traitement en cours (optionnel)" className="input-large" />
          <label className="text-sm text-stone-600">
            Date de fin du traitement
            <input name="traitementDateFin" type="date" className="input-large mt-1" />
          </label>
        </div>

        <textarea name="infoDescription" rows={2} placeholder="Information importante (optionnel)" className="input-large w-full" />

        <div className="grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-2">
          <p className="text-sm text-stone-600 sm:col-span-2">Contact d&apos;urgence (si différent des responsables)</p>
          <input name="urgencePrenom" placeholder="Prénom" className="input-large" />
          <input name="urgenceNom" placeholder="Nom" className="input-large" />
          <input name="urgenceLien" placeholder="Lien (ex. Tante)" className="input-large" />
          <input name="urgenceTelephone" placeholder="Téléphone" className="input-large" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setEtape((e) => (e > 1 ? ((e - 1) as Etape) : e))} className={etape === 1 ? "invisible" : "btn-secondary"}>
          ← Précédent
        </button>
        {etape < 4 ? (
          <button
            type="button"
            onClick={(e) => {
              // Les champs des étapes non affichées (display: none) sont
              // ignorés par la validation native : on ne valide donc que
              // l'étape actuellement visible avant de passer à la suivante.
              const form = e.currentTarget.form;
              if (form && !form.checkValidity()) {
                form.reportValidity();
                return;
              }
              setEtape((etp) => (etp < 4 ? ((etp + 1) as Etape) : etp));
            }}
            className="btn-primary"
          >
            Suivant →
          </button>
        ) : (
          <button type="submit" className="btn-primary">
            Créer la fiche
          </button>
        )}
      </div>
    </form>
  );
}
