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
  await page.waitForSelector("text=Retour à la liste", { timeout: 15000 });

  const onglets = page.locator(".mb-4.flex.gap-1.overflow-x-auto");

  async function ouvrirPlusActions() {
    await page.evaluate(() => {
      const resume = Array.from(document.querySelectorAll("summary")).find((s) => s.textContent?.includes("Plus d'actions"));
      const details = resume?.closest("details");
      if (details) details.open = true;
    });
  }

  // Étape 1 : on force l'état "non renseignée" pour partir d'un état connu
  // (l'onglet Général est déjà celui affiché par défaut). Le bouton est
  // ciblé via le formulaire contenant le sélecteur d'autorisation, pour
  // éviter toute ambiguïté avec les autres boutons "Enregistrer" de la
  // fiche (Accueil, responsables, médecin...).
  const formulaireInformations = page.locator("form").filter({ has: page.locator('select[name="autorisationPhotos"]') });
  await formulaireInformations.locator('select[name="autorisationPhotos"]').selectOption("NON_RENSEIGNEE");
  await formulaireInformations.getByRole("button", { name: "Enregistrer" }).click();
  await page.waitForLoadState("networkidle");

  await ouvrirPlusActions();
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(0);

  await onglets.getByText("Activités").click();
  await expect(page.getByText(/Autorisation de diffusion des photos non renseignée/)).toBeVisible();
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(0);

  // Étape 2 : une fois l'autorisation accordée, les deux formulaires
  // (en-tête "Plus d'actions" et galerie de souvenirs) apparaissent.
  await onglets.getByText("Général").click();
  await formulaireInformations.locator('select[name="autorisationPhotos"]').selectOption("AUTORISEE");
  await formulaireInformations.getByRole("button", { name: "Enregistrer" }).click();
  await page.waitForLoadState("networkidle");

  await ouvrirPlusActions();
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(1);

  // Sur cet onglet, le formulaire de la galerie de souvenirs s'ajoute à
  // celui de l'en-tête ("Plus d'actions"), resté ouvert depuis l'étape
  // précédente : les deux sont gated par la même autorisation.
  await onglets.getByText("Activités").click();
  await expect(page.locator('input[type="file"][name="photo"]')).toHaveCount(2);
});
