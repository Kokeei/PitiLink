import { describe, expect, it } from "vitest";
import {
  traitementsEnCours,
  traitementsTermines,
  documentsParCategorie,
  categorieDocument,
  construireHistorique,
  type Traitement,
} from "./enfants";

const maintenant = new Date("2026-09-20T00:00:00.000Z");

function traitement(overrides: Partial<Traitement>): Traitement {
  return { id: "t1", nom: "Sirop", dateDebut: null, dateFin: new Date("2026-09-25"), note: null, ...overrides };
}

describe("traitementsEnCours / traitementsTermines", () => {
  it("classe un traitement dont la date de fin est future comme en cours", () => {
    const t = traitement({ dateFin: new Date("2026-09-25") });
    expect(traitementsEnCours([t], maintenant)).toEqual([t]);
    expect(traitementsTermines([t], maintenant)).toEqual([]);
  });

  it("classe un traitement dont la date de fin est passée comme terminé", () => {
    const t = traitement({ dateFin: new Date("2026-09-10") });
    expect(traitementsEnCours([t], maintenant)).toEqual([]);
    expect(traitementsTermines([t], maintenant)).toEqual([t]);
  });

  it("un traitement se terminant exactement aujourd'hui reste en cours", () => {
    const t = traitement({ dateFin: maintenant });
    expect(traitementsEnCours([t], maintenant)).toEqual([t]);
  });
});

describe("categorieDocument / documentsParCategorie", () => {
  it("classe chaque type de document dans la bonne catégorie", () => {
    expect(categorieDocument("CONTRAT")).toBe("ADMINISTRATIF");
    expect(categorieDocument("AUTORISATION")).toBe("ADMINISTRATIF");
    expect(categorieDocument("JUSTIFICATIF")).toBe("ADMINISTRATIF");
    expect(categorieDocument("ORDONNANCE")).toBe("SANTE");
    expect(categorieDocument("AUTRE")).toBe("AUTRES");
  });

  it("regroupe une liste de documents par catégorie", () => {
    const documents = [
      { id: "1", type: "CONTRAT" },
      { id: "2", type: "ORDONNANCE" },
      { id: "3", type: "AUTRE" },
      { id: "4", type: "JUSTIFICATIF" },
    ];
    const groupes = documentsParCategorie(documents);
    expect(groupes.ADMINISTRATIF.map((d) => d.id)).toEqual(["1", "4"]);
    expect(groupes.SANTE.map((d) => d.id)).toEqual(["2"]);
    expect(groupes.AUTRES.map((d) => d.id)).toEqual(["3"]);
  });
});

describe("construireHistorique", () => {
  it("trie les événements du plus récent au plus ancien", () => {
    const evenements = [
      { id: "a", date: new Date("2026-09-01"), titre: "Allergie ajoutée", description: null },
      { id: "b", date: new Date("2026-09-15"), titre: "Document ajouté", description: null },
    ];
    const resultat = construireHistorique(evenements, [], maintenant);
    expect(resultat.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("insère les traitements terminés calculés, à la date de leur fin, sans les stocker séparément", () => {
    const evenements = [{ id: "a", date: new Date("2026-09-01"), titre: "Allergie ajoutée", description: null }];
    const traitements = [traitement({ id: "t1", nom: "Sirop", dateFin: new Date("2026-09-10"), note: "3x/jour" })];
    const resultat = construireHistorique(evenements, traitements, maintenant);
    expect(resultat.map((e) => e.id)).toEqual(["traitement-t1", "a"]);
    expect(resultat[0].titre).toBe("Traitement terminé : Sirop");
    expect(resultat[0].description).toBe("3x/jour");
  });

  it("exclut les traitements encore en cours de l'historique", () => {
    const traitements = [traitement({ id: "t1", dateFin: new Date("2026-09-30") })];
    const resultat = construireHistorique([], traitements, maintenant);
    expect(resultat).toEqual([]);
  });
});
