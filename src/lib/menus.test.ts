import { describe, expect, it } from "vitest";
import { resoudreMenuEnfant, detecterConflitsAllergie, lundiDeLaSemaine, type EntreeMenu } from "@/lib/menus";

const TYPE_DEJEUNER = "type-dejeuner";
const GROUPE_BEBES = "groupe-bebes";

function entree(partial: Partial<EntreeMenu> & Pick<EntreeMenu, "portee">): EntreeMenu {
  return {
    id: `entree-${Math.random()}`,
    jourSemaine: 0,
    typeRepasId: TYPE_DEJEUNER,
    groupeId: null,
    enfantId: null,
    note: null,
    composants: [{ id: "c1", alimentId: "poisson", alimentNom: "Poisson", ordre: 0, remplaceAlimentNom: null, motifRemplacement: null }],
    ...partial,
  };
}

describe("resoudreMenuEnfant — héritage individuel > catégorie > général", () => {
  it("utilise le menu général quand rien de plus spécifique n'existe (enfant C)", () => {
    const entrees = [entree({ portee: "GENERAL" })];
    const resultat = resoudreMenuEnfant(entrees, { id: "enfant-c", groupeId: null }, 0, TYPE_DEJEUNER);
    expect(resultat?.portee).toBe("GENERAL");
  });

  it("utilise le menu catégorie quand il existe pour le groupe de l'enfant (enfant B)", () => {
    const entrees = [
      entree({ portee: "GENERAL" }),
      entree({ portee: "CATEGORIE", groupeId: GROUPE_BEBES, composants: [{ id: "c2", alimentId: "poulet", alimentNom: "Poulet", ordre: 0, remplaceAlimentNom: null, motifRemplacement: null }] }),
    ];
    const resultat = resoudreMenuEnfant(entrees, { id: "enfant-b", groupeId: GROUPE_BEBES }, 0, TYPE_DEJEUNER);
    expect(resultat?.portee).toBe("CATEGORIE");
    expect(resultat?.composants[0].alimentNom).toBe("Poulet");
  });

  it("utilise le menu individuel en priorité absolue, même si catégorie et général existent (enfant A)", () => {
    const entrees = [
      entree({ portee: "GENERAL" }),
      entree({ portee: "CATEGORIE", groupeId: GROUPE_BEBES }),
      entree({
        portee: "INDIVIDUEL",
        enfantId: "enfant-a",
        composants: [{ id: "c3", alimentId: "puree", alimentNom: "Purée", ordre: 0, remplaceAlimentNom: null, motifRemplacement: null }],
      }),
    ];
    const resultat = resoudreMenuEnfant(entrees, { id: "enfant-a", groupeId: GROUPE_BEBES }, 0, TYPE_DEJEUNER);
    expect(resultat?.portee).toBe("INDIVIDUEL");
    expect(resultat?.composants[0].alimentNom).toBe("Purée");
  });

  it("un menu catégorie d'un autre groupe n'affecte pas un enfant sans groupe", () => {
    const entrees = [entree({ portee: "GENERAL" }), entree({ portee: "CATEGORIE", groupeId: GROUPE_BEBES })];
    const resultat = resoudreMenuEnfant(entrees, { id: "enfant-x", groupeId: null }, 0, TYPE_DEJEUNER);
    expect(resultat?.portee).toBe("GENERAL");
  });

  it("le menu individuel d'un autre enfant n'est jamais appliqué", () => {
    const entrees = [entree({ portee: "GENERAL" }), entree({ portee: "INDIVIDUEL", enfantId: "autre-enfant" })];
    const resultat = resoudreMenuEnfant(entrees, { id: "enfant-a", groupeId: null }, 0, TYPE_DEJEUNER);
    expect(resultat?.portee).toBe("GENERAL");
  });

  it("renvoie null quand aucun menu n'est défini à aucun niveau", () => {
    const resultat = resoudreMenuEnfant([], { id: "enfant-a", groupeId: GROUPE_BEBES }, 0, TYPE_DEJEUNER);
    expect(resultat).toBeNull();
  });

  it("un jour ou un type de repas différent n'est jamais confondu avec un autre", () => {
    const entrees = [entree({ portee: "GENERAL", jourSemaine: 0 })];
    expect(resoudreMenuEnfant(entrees, { id: "e", groupeId: null }, 1, TYPE_DEJEUNER)).toBeNull();
    expect(resoudreMenuEnfant(entrees, { id: "e", groupeId: null }, 0, "autre-type")).toBeNull();
  });
});

describe("detecterConflitsAllergie", () => {
  it("détecte un conflit simple entre un aliment et une allergie déclarée", () => {
    const conflits = detecterConflitsAllergie(
      [{ alimentId: "lait", alimentNom: "Lait", allergeneIds: ["lactose"] }],
      [{ id: "e1", nomComplet: "Kiivai", allergies: [{ allergeneId: "lactose", allergeneNom: "Lactose" }] }]
    );
    expect(conflits).toHaveLength(1);
    expect(conflits[0]).toMatchObject({ enfantId: "e1", allergeneNom: "Lactose", alimentNom: "Lait" });
  });

  it("détecte plusieurs conflits pour plusieurs enfants sur le même menu", () => {
    const conflits = detecterConflitsAllergie(
      [{ alimentId: "lait", alimentNom: "Lait", allergeneIds: ["lactose"] }],
      [
        { id: "e1", nomComplet: "Kiivai", allergies: [{ allergeneId: "lactose", allergeneNom: "Lactose" }] },
        { id: "e2", nomComplet: "Emma", allergies: [{ allergeneId: "lactose", allergeneNom: "Lactose" }] },
        { id: "e3", nomComplet: "Noah", allergies: [] },
      ]
    );
    expect(conflits).toHaveLength(2);
    expect(conflits.map((c) => c.enfantId).sort()).toEqual(["e1", "e2"]);
  });

  it("ne signale rien quand aucun allergène du menu ne correspond aux allergies déclarées", () => {
    const conflits = detecterConflitsAllergie(
      [{ alimentId: "riz", alimentNom: "Riz", allergeneIds: [] }],
      [{ id: "e1", nomComplet: "Kiivai", allergies: [{ allergeneId: "lactose", allergeneNom: "Lactose" }] }]
    );
    expect(conflits).toHaveLength(0);
  });
});

describe("lundiDeLaSemaine", () => {
  it("renvoie le même lundi pour n'importe quel jour de la semaine", () => {
    const lundi = new Date("2026-01-05T00:00:00"); // un lundi
    for (let i = 0; i < 7; i++) {
      const jour = new Date(lundi);
      jour.setDate(jour.getDate() + i);
      expect(lundiDeLaSemaine(jour).toDateString()).toBe(lundi.toDateString());
    }
  });
});
