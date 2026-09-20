import { test, expect } from "@playwright/test";

const MOT_DE_PASSE = "Password123!";

async function connecter(page: import("@playwright/test").Page, email: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
  // La redirection vers l'espace du rôle se fait via le middleware sur une
  // requête complète : on force une navigation pour la déclencher de façon
  // fiable plutôt que de dépendre du routage client après le Server Action.
  await page.goto("/");
}

test.describe("Connexion par rôle", () => {
  test("direction est redirigée vers /direction", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await expect(page).toHaveURL(/\/direction$/);
  });

  test("professionnel est redirigé vers /pro", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await expect(page).toHaveURL(/\/pro$/);
  });

  test("parent est redirigé vers /parent", async ({ page }) => {
    await connecter(page, "parent.demo@pitilink.local");
    await expect(page).toHaveURL(/\/parent/);
  });

  test("un mot de passe incorrect affiche un message d'erreur et ne connecte pas", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill('input[name="email"]', "direction.demo@pitilink.local");
    await page.fill('input[name="password"]', "mauvais-mot-de-passe");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("un professionnel ne peut pas accéder à /direction", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await expect(page).toHaveURL(/\/pro$/);

    await page.goto("/direction");
    await expect(page).toHaveURL(/\/pro$/);
  });
});
