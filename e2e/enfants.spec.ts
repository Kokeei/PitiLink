import { test, expect, type Page } from "@playwright/test";

const MOT_DE_PASSE = "Password123!";

async function connecter(page: Page, email: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

test.describe("Enfants — liste", () => {
  test("le tableau filtre, trie et se réinitialise instantanément", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table").first();
    await expect(table).toContainText("Kiivai");
    await expect(table).toContainText("Emma");

    // Filtre par prénom, instantané (pas de rechargement de page).
    await page.getByLabel("Filtrer par prénom").fill("kiiv");
    await expect(table).toContainText("Kiivai");
    await expect(table).not.toContainText("Emma");

    await page.getByText("Réinitialiser").first().click();
    await expect(table).toContainText("Emma");

    // Tri par âge : les deux sens doivent donner un ordre différent.
    await page.getByText("Âge").click();
    const texteAsc = await table.locator("tbody tr").first().textContent();
    await page.getByText("Âge").click(); // inverse le sens
    await expect(table.locator("tbody tr").first()).not.toHaveText(texteAsc ?? "");
  });

  test("l'export CSV télécharge un fichier", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");

    const [download] = await Promise.all([page.waitForEvent("download"), page.getByText("Exporter").click()]);
    expect(download.suggestedFilename()).toBe("enfants.csv");
  });
});

test.describe("Enfants — ajout", () => {
  test("l'assistant en 4 étapes crée une fiche complète", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants/nouveau");
    await page.waitForLoadState("networkidle");

    await page.fill('input[name="prenom"]', "Léo");
    await page.fill('input[name="nom"]', "Test-E2E");
    await page.fill('input[name="dateNaissance"]', "2024-06-01");
    await page.getByRole("button", { name: "Suivant →" }).click();

    await page.locator('input[name="joursPresence"][value="Lundi"]').check();
    await page.fill('input[name="horaireHabituel"]', "08h00 - 17h00");
    await page.getByRole("button", { name: "Suivant →" }).click();

    await page.getByRole("button", { name: "Suivant →" }).click(); // responsable facultatif, on saute

    await page.fill('textarea[name="infoDescription"]', "Ne pas donner d'arachides");
    await page.getByRole("button", { name: "Créer la fiche" }).click();

    await page.waitForURL(/\/direction\/enfants\/(?!nouveau)/, { timeout: 15000 });
    await page.waitForSelector("text=Retour à la liste");
    await expect(page.getByRole("heading", { name: "Léo Test-E2E" })).toBeVisible();

    await page.getByRole("button", { name: "❤️ Santé" }).click();
    await expect(page.getByText("Ne pas donner d'arachides")).toBeVisible();
  });
});

test.describe("Enfants — fiche : onglets et actions", () => {
  test("la fiche direction affiche les 7 onglets et les cartes attendues", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Kiivai" }).click();
    await page.waitForSelector("text=Retour à la liste", { timeout: 15000 });

    for (const onglet of ["Général", "Santé", "Suivi quotidien", "Menus", "Activités", "Documents", "Historique"]) {
      await expect(page.getByRole("button", { name: new RegExp(onglet) })).toBeVisible();
    }

    await expect(page.getByText("🪪 Personnes autorisées")).toBeVisible();
    await expect(page.getByText("Mei Wong")).toBeVisible();

    await page.getByRole("button", { name: "❤️ Santé" }).click();
    await expect(page.getByText("Protéines de lait de vache").first()).toBeVisible();

    await page.getByRole("button", { name: "🕘 Historique" }).click();
    await expect(page.getByText(/Allergie ajoutée/)).toBeVisible();
  });

  test("le menu « Plus d'actions » permet d'archiver puis de réactiver un enfant", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Noah" }).click();
    await page.waitForSelector("text=Retour à la liste", { timeout: 15000 });

    // Force l'ouverture plutôt qu'un clic-bascule : l'attribut `open` du
    // <details> persiste sur le nœud DOM d'un rendu RSC à l'autre, donc un
    // second clic sur un résumé déjà ouvert par le rendu précédent le
    // refermerait au lieu de l'ouvrir (même piège que pour le module Menus).
    async function ouvrirPlusActions() {
      await page.evaluate(() => {
        const resume = Array.from(document.querySelectorAll("summary")).find((s) => s.textContent?.includes("Plus d'actions"));
        const details = resume?.closest("details");
        if (details) details.open = true;
      });
    }

    // Normalise l'état de départ (un enfant partagé entre exécutions de la
    // suite peut avoir été laissé archivé par une exécution précédente).
    if (await page.locator(".pill", { hasText: "Archivé" }).isVisible()) {
      await ouvrirPlusActions();
      await page.getByText("▶️ Réactiver").click();
      await page.waitForLoadState("networkidle");
    }

    await ouvrirPlusActions();
    await page.getByText("🗄️ Archiver").click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".pill", { hasText: "Archivé" })).toBeVisible();

    await ouvrirPlusActions();
    await page.getByText("▶️ Réactiver").click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".pill", { hasText: "Actif" }).first()).toBeVisible();
  });
});

test.describe("Enfants — permissions", () => {
  test("un professionnel ne peut pas accéder à la liste ni à l'ajout direction", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/pro$/);

    await page.goto("/direction/enfants/nouveau");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/pro$/);
  });

  test("la fiche professionnel n'expose aucun formulaire de modification hors suivi quotidien / activités", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await page.goto("/pro/groupe");
    await page.waitForLoadState("networkidle");
    await page.locator('a[href*="/pro/enfants/"]').first().click();
    await page.waitForURL(/\/pro\/enfants\//, { timeout: 15000 });
    await page.waitForSelector("text=Retour à la liste", { timeout: 15000 });

    // Onglet Général : uniquement de la lecture, pas de bouton "Enregistrer".
    await expect(page.getByRole("button", { name: "Enregistrer" })).toHaveCount(0);

    await page.getByRole("button", { name: "❤️ Santé" }).click();
    await expect(page.getByText("+ Ajouter")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retirer" })).toHaveCount(0);

    // Le menu "Plus d'actions" ne propose pas les actions réservées à la
    // direction (changement de statut) : seule l'option photo y figure.
    await page.getByText("Plus d'actions").click();
    await expect(page.getByText("Suspendre")).toHaveCount(0);
    await expect(page.getByText("Archiver")).toHaveCount(0);
  });
});
