"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculerAge } from "@/lib/format";
import { STATUTS_ENFANT_PILL } from "@/lib/badges";

export type LigneEnfant = {
  id: string;
  prenom: string;
  nom: string;
  photoUrl: string | null;
  dateNaissance: string; // ISO — sérialisable depuis un composant serveur
  groupeNom: string | null;
  statut: string;
  allergies: string[];
};

type Colonne = "prenom" | "nom" | "age" | "groupe" | "statut";
type Direction = "asc" | "desc";

const LIBELLES_STATUT: Record<string, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  SORTI: "Sorti",
  ARCHIVE: "Archivé",
};

const TAILLES_PAGE = [8, 20, 50, 100];

function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function TableauEnfants({ enfants, groupes }: { enfants: LigneEnfant[]; groupes: { id: string; nom: string }[] }) {
  const [filtrePrenom, setFiltrePrenom] = useState("");
  const [filtreNom, setFiltreNom] = useState("");
  const [filtreGroupe, setFiltreGroupe] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreAllergies, setFiltreAllergies] = useState("");
  const [panneauFiltresOuvert, setPanneauFiltresOuvert] = useState(false);
  const [tri, setTri] = useState<{ colonne: Colonne; direction: Direction } | null>(null);
  const [page, setPage] = useState(1);
  const [taillePage, setTaillePage] = useState(TAILLES_PAGE[0]);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  const filtresActifs = Boolean(filtrePrenom || filtreNom || filtreGroupe || filtreStatut || filtreAllergies);

  const filtres = useMemo(() => {
    const fp = normaliser(filtrePrenom);
    const fn = normaliser(filtreNom);
    const fa = normaliser(filtreAllergies);
    return enfants.filter((e) => {
      if (fp && !normaliser(e.prenom).includes(fp)) return false;
      if (fn && !normaliser(e.nom).includes(fn)) return false;
      if (filtreGroupe && e.groupeNom !== filtreGroupe) return false;
      if (filtreStatut && e.statut !== filtreStatut) return false;
      if (fa) {
        const correspond = fa === "aucune" ? e.allergies.length === 0 : e.allergies.some((a) => normaliser(a).includes(fa));
        if (!correspond) return false;
      }
      return true;
    });
  }, [enfants, filtrePrenom, filtreNom, filtreGroupe, filtreStatut, filtreAllergies]);

  const trie = useMemo(() => {
    if (!tri) return filtres;
    const facteur = tri.direction === "asc" ? 1 : -1;
    return [...filtres].sort((a, b) => {
      switch (tri.colonne) {
        case "prenom":
          return facteur * a.prenom.localeCompare(b.prenom);
        case "nom":
          return facteur * a.nom.localeCompare(b.nom);
        case "age":
          return facteur * (new Date(b.dateNaissance).getTime() - new Date(a.dateNaissance).getTime());
        case "groupe":
          return facteur * (a.groupeNom ?? "").localeCompare(b.groupeNom ?? "");
        case "statut":
          return facteur * a.statut.localeCompare(b.statut);
        default:
          return 0;
      }
    });
  }, [filtres, tri]);

  const nbPages = Math.max(1, Math.ceil(trie.length / taillePage));
  const pageBornee = Math.min(page, nbPages);
  const page_enfants = trie.slice((pageBornee - 1) * taillePage, pageBornee * taillePage);

  function trierPar(colonne: Colonne) {
    setTri((actuel) => {
      if (actuel?.colonne !== colonne) return { colonne, direction: "asc" };
      if (actuel.direction === "asc") return { colonne, direction: "desc" };
      return null;
    });
  }

  function flecheTri(colonne: Colonne) {
    if (tri?.colonne !== colonne) return "↕";
    return tri.direction === "asc" ? "↑" : "↓";
  }

  function reinitialiser() {
    setFiltrePrenom("");
    setFiltreNom("");
    setFiltreGroupe("");
    setFiltreStatut("");
    setFiltreAllergies("");
    setTri(null);
    setPage(1);
  }

  function basculerSelection(id: string) {
    setSelection((s) => {
      const copie = new Set(s);
      if (copie.has(id)) copie.delete(id);
      else copie.add(id);
      return copie;
    });
  }

  function toutSelectionnerPage() {
    setSelection((s) => {
      const idsPage = page_enfants.map((e) => e.id);
      const touslàSelectionnes = idsPage.every((id) => s.has(id));
      const copie = new Set(s);
      if (touslàSelectionnes) idsPage.forEach((id) => copie.delete(id));
      else idsPage.forEach((id) => copie.add(id));
      return copie;
    });
  }

  function exporterCsv() {
    const lignes = (selection.size > 0 ? trie.filter((e) => selection.has(e.id)) : trie).map((e) => [
      e.prenom,
      e.nom,
      calculerAge(new Date(e.dateNaissance)),
      e.groupeNom ?? "Sans groupe",
      LIBELLES_STATUT[e.statut] ?? e.statut,
      e.allergies.join(" / ") || "Aucune",
    ]);
    const entete = ["Prénom", "Nom", "Âge", "Groupe", "Statut", "Allergies / Particularités"];
    const csv = [entete, ...lignes].map((ligne) => ligne.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enfants.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtrePrenomInput = (
    <input
      value={filtrePrenom}
      onChange={(e) => {
        setFiltrePrenom(e.target.value);
        setPage(1);
      }}
      placeholder="Rechercher..."
      className="input-large text-xs"
      aria-label="Filtrer par prénom"
    />
  );
  const filtreNomInput = (
    <input
      value={filtreNom}
      onChange={(e) => {
        setFiltreNom(e.target.value);
        setPage(1);
      }}
      placeholder="Rechercher..."
      className="input-large text-xs"
      aria-label="Filtrer par nom"
    />
  );
  const filtreGroupeSelect = (
    <select
      value={filtreGroupe}
      onChange={(e) => {
        setFiltreGroupe(e.target.value);
        setPage(1);
      }}
      className="input-large text-xs"
      aria-label="Filtrer par groupe"
    >
      <option value="">Tous</option>
      {groupes.map((g) => (
        <option key={g.id} value={g.nom}>
          {g.nom}
        </option>
      ))}
    </select>
  );
  const filtreStatutSelect = (
    <select
      value={filtreStatut}
      onChange={(e) => {
        setFiltreStatut(e.target.value);
        setPage(1);
      }}
      className="input-large text-xs"
      aria-label="Filtrer par statut"
    >
      <option value="">Tous</option>
      {Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => (
        <option key={valeur} value={valeur}>
          {libelle}
        </option>
      ))}
    </select>
  );
  const filtreAllergiesInput = (
    <input
      value={filtreAllergies}
      onChange={(e) => {
        setFiltreAllergies(e.target.value);
        setPage(1);
      }}
      placeholder="Rechercher..."
      className="input-large text-xs"
      aria-label="Filtrer par allergies"
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          {trie.length} enfant{trie.length !== 1 ? "s" : ""} {filtresActifs && `(sur ${enfants.length})`}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPanneauFiltresOuvert((v) => !v)} className="btn-secondary text-xs md:hidden">
            🔎 Filtres{filtresActifs ? " •" : ""}
          </button>
          <button type="button" onClick={exporterCsv} className="btn-secondary text-xs">
            ⬇️ Exporter{selection.size > 0 ? ` (${selection.size})` : ""}
          </button>
        </div>
      </div>

      {panneauFiltresOuvert && (
        <div className="card grid grid-cols-2 gap-2 md:hidden">
          <div>
            <p className="mb-1 text-xs text-stone-500">Prénom</p>
            {filtrePrenomInput}
          </div>
          <div>
            <p className="mb-1 text-xs text-stone-500">Nom</p>
            {filtreNomInput}
          </div>
          <div>
            <p className="mb-1 text-xs text-stone-500">Groupe</p>
            {filtreGroupeSelect}
          </div>
          <div>
            <p className="mb-1 text-xs text-stone-500">Statut</p>
            {filtreStatutSelect}
          </div>
          <div className="col-span-2">
            <p className="mb-1 text-xs text-stone-500">Allergies</p>
            {filtreAllergiesInput}
          </div>
          {filtresActifs && (
            <button type="button" onClick={reinitialiser} className="col-span-2 text-xs text-stone-500 underline">
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="w-8 pb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={page_enfants.length > 0 && page_enfants.every((e) => selection.has(e.id))}
                  onChange={toutSelectionnerPage}
                  aria-label="Tout sélectionner"
                />
              </th>
              <th className="w-12 pb-2">Photo</th>
              <th className="cursor-pointer select-none pb-2" onClick={() => trierPar("prenom")}>
                Prénom {flecheTri("prenom")}
              </th>
              <th className="cursor-pointer select-none pb-2" onClick={() => trierPar("nom")}>
                Nom {flecheTri("nom")}
              </th>
              <th className="cursor-pointer select-none pb-2" onClick={() => trierPar("age")}>
                Âge {flecheTri("age")}
              </th>
              <th className="cursor-pointer select-none pb-2" onClick={() => trierPar("groupe")}>
                Groupe {flecheTri("groupe")}
              </th>
              <th className="cursor-pointer select-none pb-2" onClick={() => trierPar("statut")}>
                Statut {flecheTri("statut")}
              </th>
              <th className="pb-2">Allergies / Particularités</th>
              <th className="pb-2">Actions</th>
            </tr>
            <tr className="hidden text-left md:table-row">
              <td />
              <td />
              <td className="pb-2 pr-2">{filtrePrenomInput}</td>
              <td className="pb-2 pr-2">{filtreNomInput}</td>
              <td />
              <td className="pb-2 pr-2">{filtreGroupeSelect}</td>
              <td className="pb-2 pr-2">{filtreStatutSelect}</td>
              <td className="pb-2 pr-2">{filtreAllergiesInput}</td>
              <td className="pb-2">
                {filtresActifs && (
                  <button type="button" onClick={reinitialiser} className="text-xs text-stone-500 underline">
                    Réinitialiser
                  </button>
                )}
              </td>
            </tr>
          </thead>
          <tbody>
            {page_enfants.map((e) => (
              <tr key={e.id} className="border-t border-stone-100">
                <td className="py-2">
                  <input type="checkbox" className="h-4 w-4" checked={selection.has(e.id)} onChange={() => basculerSelection(e.id)} />
                </td>
                <td className="py-2">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-lg">
                    {e.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      "👶"
                    )}
                  </div>
                </td>
                <td className="py-2">
                  <Link href={`/direction/enfants/${e.id}`} className="font-medium text-orange-700 hover:underline">
                    {e.prenom}
                  </Link>
                </td>
                <td>
                  <Link href={`/direction/enfants/${e.id}`} className="hover:underline">
                    {e.nom}
                  </Link>
                </td>
                <td>{calculerAge(new Date(e.dateNaissance))}</td>
                <td>{e.groupeNom ?? "Sans groupe"}</td>
                <td>
                  <span className={`pill ${STATUTS_ENFANT_PILL[e.statut] ?? "bg-stone-100"}`}>{LIBELLES_STATUT[e.statut] ?? e.statut}</span>
                </td>
                <td>
                  {e.allergies.length > 0 ? (
                    <span className="pill bg-red-100 text-xs text-red-700">⚠️ {e.allergies.join(", ")}</span>
                  ) : (
                    <span className="text-stone-400">Aucune</span>
                  )}
                </td>
                <td className="whitespace-nowrap py-2">
                  <Link href={`/direction/enfants/${e.id}`} className="mr-2" title="Voir la fiche">
                    👁️
                  </Link>
                  <Link href={`/direction/enfants/${e.id}#onglet-general`} title="Modifier">
                    ✏️
                  </Link>
                </td>
              </tr>
            ))}
            {page_enfants.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-stone-500">
                  Aucun enfant ne correspond à ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500">
        <p>
          {trie.length === 0
            ? "0 résultat"
            : `${(pageBornee - 1) * taillePage + 1} – ${Math.min(pageBornee * taillePage, trie.length)} sur ${trie.length} résultats`}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageBornee <= 1} className="btn-secondary px-2 py-1 text-xs disabled:opacity-40">
            ←
          </button>
          <span className="text-xs">
            {pageBornee} / {nbPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(nbPages, p + 1))}
            disabled={pageBornee >= nbPages}
            className="btn-secondary px-2 py-1 text-xs disabled:opacity-40"
          >
            →
          </button>
          <select
            value={taillePage}
            onChange={(e) => {
              setTaillePage(Number(e.target.value));
              setPage(1);
            }}
            className="input-large w-auto text-xs"
            aria-label="Résultats par page"
          >
            {TAILLES_PAGE.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
