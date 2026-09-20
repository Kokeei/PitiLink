import { test, expect } from "@playwright/test";

test("l'ajout de photo est bloqué tant que l'autorisation de diffusion n'est pas explicitement accordée", async ({ page }) => {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', "direction.demo@pitilink.local");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  await page.goto("/direction/enfants");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Girard" }).click();
  await page.waitForLoadState("networkidle");

  const ongletsTabs = page.locator(".mb-4.flex.gap-1.overflow-x-auto");

  // Étape 1 : on force l'état "non renseignée" pour partir d'un état connu.
  await ongletsTabs.getByText("Informations").click();
  await page.selectOption('select[name="autorisationPhotos"]', "NON_RENSEIGNEE");
  await page.click('button:has-text("Enregistrer")');
  await page.waitForLoadState("networkidle");

  await ongletsTabs.getByText("Vue d'ensemble").click();
  await expect(page.getByText("Autorisation de diffusion des photos non renseignée")).toBeVisible();
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(0);

  // Étape 2 : une fois l'autorisation accordée, le formulaire d'ajout apparaît.
  await ongletsTabs.getByText("Informations").click();
  await page.selectOption('select[name="autorisationPhotos"]', "AUTORISEE");
  await page.click('button:has-text("Enregistrer")');
  await page.waitForLoadState("networkidle");

  await ongletsTabs.getByText("Vue d'ensemble").click();
  // Le formulaire "Changer la photo" (en-tête) et celui de la galerie de
  // souvenirs sont tous les deux gated par la même autorisation.
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(2);
});
