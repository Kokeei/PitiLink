import { describe, expect, it } from "vitest";
import { etatPointage } from "@/lib/pointage";

const matin = new Date("2026-10-26T07:45:00");
const soir = new Date("2026-10-26T17:10:00");

describe("etatPointage", () => {
  it("propose l'arrivée quand aucune présence n'est enregistrée", () => {
    expect(etatPointage(null)).toEqual({ etape: "arrivee" });
  });

  it("propose l'arrivée pour un enfant prévu", () => {
    expect(etatPointage({ statut: "PREVU", heureArrivee: null, heureDepart: null })).toEqual({ etape: "arrivee" });
  });

  it("propose l'arrivée pour un enfant dont la présence est à confirmer", () => {
    expect(etatPointage({ statut: "A_CONFIRMER", heureArrivee: null, heureDepart: null })).toEqual({
      etape: "arrivee",
    });
  });

  it("propose le départ une fois l'enfant arrivé", () => {
    expect(etatPointage({ statut: "PRESENT", heureArrivee: matin, heureDepart: null })).toEqual({
      etape: "depart",
      heureArrivee: matin,
    });
  });

  it("indique que la journée est terminée après le départ", () => {
    expect(etatPointage({ statut: "PRESENT", heureArrivee: matin, heureDepart: soir })).toEqual({
      etape: "parti",
      heureArrivee: matin,
      heureDepart: soir,
    });
  });

  it("ne propose aucun bouton pour un enfant absent", () => {
    expect(etatPointage({ statut: "ABSENT", heureArrivee: null, heureDepart: null })).toEqual({ etape: "absent" });
  });
});
