import { test, expect } from "@playwright/test";

test("une absence déclarée le jour même sans certificat est facturée", async ({ page }) => {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', "parent.demo@pitilink.local");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  await page.goto("/parent/absences");
  await page.waitForLoadState("networkidle");

  const aujourdhui = new Date().toISOString().slice(0, 10);
  await page.selectOption('select[name="type"]', "AUTRE");
  await page.fill('input[name="dateDebut"]', aujourdhui);
  await page.fill('input[name="dateFin"]', aujourdhui);
  await page.click('button:has-text("Déclarer l\'absence")');
  await page.waitForLoadState("networkidle");

  // .card.flex cible spécifiquement une ligne d'absence de la liste, pas la
  // carte du formulaire (qui contient aussi le mot "Autre" via son <select>).
  const premiereAbsence = page.locator(".card.flex").filter({ hasText: "Autre" }).first();
  await expect(premiereAbsence.getByText("Facturée")).toBeVisible();
});
