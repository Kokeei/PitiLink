import { describe, expect, it } from "vitest";
import { calculerAge, formatDate, debutJournee, finJournee } from "@/lib/format";

describe("calculerAge", () => {
  it("affiche des jours pour un nouveau-né", () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 3);
    expect(calculerAge(hier)).toMatch(/^\d+ jours?$/);
  });

  it("affiche des mois pour un bébé de quelques mois", () => {
    const naissance = new Date();
    naissance.setMonth(naissance.getMonth() - 5);
    expect(calculerAge(naissance)).toBe("5 mois");
  });

  it("affiche des années au-delà de 24 mois", () => {
    const naissance = new Date();
    naissance.setFullYear(naissance.getFullYear() - 3);
    expect(calculerAge(naissance)).toBe("3 ans");
  });

  it("affiche années + mois quand ce n'est pas un anniversaire exact", () => {
    const naissance = new Date();
    naissance.setFullYear(naissance.getFullYear() - 3);
    naissance.setMonth(naissance.getMonth() - 2);
    expect(calculerAge(naissance)).toBe("3 ans 2 mois");
  });
});

describe("debutJournee / finJournee", () => {
  it("remet l'heure à minuit / 23:59:59", () => {
    const date = new Date("2026-03-15T14:32:00");
    expect(debutJournee(date).getHours()).toBe(0);
    expect(debutJournee(date).getMinutes()).toBe(0);
    expect(finJournee(date).getHours()).toBe(23);
    expect(finJournee(date).getMinutes()).toBe(59);
  });

  it("ne modifie pas l'objet Date original", () => {
    const date = new Date("2026-03-15T14:32:00");
    debutJournee(date);
    expect(date.getHours()).toBe(14);
  });
});

describe("formatDate", () => {
  it("formate en JJ/MM/AAAA", () => {
    expect(formatDate(new Date("2026-01-05T00:00:00Z"))).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("accepte une chaîne de date", () => {
    expect(formatDate("2026-01-05")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
