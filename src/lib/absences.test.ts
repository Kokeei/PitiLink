import { describe, expect, it } from "vitest";
import { calculerImpactFacturation, type ReglesFacturationAbsence } from "@/lib/absences";

const REGLES_PAR_DEFAUT: ReglesFacturationAbsence = {
  absenceDelaiPreavisJours: 2,
  absenceMaladieCertificatDecompte: true,
  absenceMaladieSansCertificatDecompte: false,
};

function jours(n: number): Date {
  const d = new Date("2026-01-10T08:00:00Z");
  d.setDate(d.getDate() + n);
  return d;
}

describe("calculerImpactFacturation", () => {
  it("décompte une maladie avec certificat médical, quel que soit le préavis", () => {
    const { impact } = calculerImpactFacturation(
      { type: "MALADIE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: "https://blob/cert.pdf" },
      REGLES_PAR_DEFAUT
    );
    expect(impact).toBe("DECOMPTEE");
  });

  it("facture une maladie sans certificat par défaut", () => {
    const { impact } = calculerImpactFacturation(
      { type: "MALADIE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: null },
      REGLES_PAR_DEFAUT
    );
    expect(impact).toBe("FACTUREE");
  });

  it("décompte une maladie sans certificat si la garderie l'autorise", () => {
    const { impact } = calculerImpactFacturation(
      { type: "MALADIE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: null },
      { ...REGLES_PAR_DEFAUT, absenceMaladieSansCertificatDecompte: true }
    );
    expect(impact).toBe("DECOMPTEE");
  });

  it("retombe sur la règle de préavis pour une maladie avec certificat si la garderie ne l'autorise pas automatiquement", () => {
    const regles = { ...REGLES_PAR_DEFAUT, absenceMaladieCertificatDecompte: false };
    const avecPreavis = calculerImpactFacturation(
      { type: "MALADIE", dateDebut: jours(5), createdAt: jours(0), justificatifUrl: "url" },
      regles
    );
    expect(avecPreavis.impact).toBe("DECOMPTEE");

    const sansPreavis = calculerImpactFacturation(
      { type: "MALADIE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: "url" },
      regles
    );
    expect(sansPreavis.impact).toBe("FACTUREE");
  });

  it("facture une absence déclarée le jour même", () => {
    const { impact, motif } = calculerImpactFacturation(
      { type: "AUTRE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: null },
      REGLES_PAR_DEFAUT
    );
    expect(impact).toBe("FACTUREE");
    expect(motif).toMatch(/jour même/);
  });

  it("décompte une absence déclarée avec suffisamment de préavis", () => {
    const { impact } = calculerImpactFacturation(
      { type: "VACANCES", dateDebut: jours(2), createdAt: jours(0), justificatifUrl: null },
      REGLES_PAR_DEFAUT
    );
    expect(impact).toBe("DECOMPTEE");
  });

  it("facture une absence avec un préavis insuffisant", () => {
    const { impact } = calculerImpactFacturation(
      { type: "GARDE_DOMICILE", dateDebut: jours(1), createdAt: jours(0), justificatifUrl: null },
      REGLES_PAR_DEFAUT
    );
    expect(impact).toBe("FACTUREE");
  });

  it("respecte un délai de préavis paramétré différemment (0 jour = jamais facturé pour préavis)", () => {
    const { impact } = calculerImpactFacturation(
      { type: "AUTRE", dateDebut: jours(0), createdAt: jours(0), justificatifUrl: null },
      { ...REGLES_PAR_DEFAUT, absenceDelaiPreavisJours: 0 }
    );
    expect(impact).toBe("DECOMPTEE");
  });
});
