import { test, expect, type Page } from "@playwright/test";

const MOT_DE_PASSE = "Password123!";

async function connecter(page: Page, email: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

/**
 * Force l'ouverture du <details> dont le <summary> visible porte exactement
 * ce texte, sans dépendre d'un clic-bascule : l'attribut `open` d'un
 * <details> persiste sur le nœud DOM entre deux rendus RSC successifs (React
 * ne le gère pas), donc re-cliquer sur un résumé déjà ouvert (par exemple
 * "Modifier" après un premier aller-retour serveur sur la même cellule) le
 * refermerait au lieu de l'ouvrir.
 */
async function ouvrirFormulaire(page: Page, texteResume: string) {
  await page.evaluate((label) => {
    const resume = Array.from(document.querySelectorAll("summary")).find(
      (s) => s.textContent?.trim() === label && s.offsetParent !== null
    );
    const details = resume?.closest("details");
    if (details) details.open = true;
  }, texteResume);
}

test.describe("Menus — consultation (données seedées)", () => {
  test("la vue Semaine affiche le menu général publié", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/menus?vue=semaine");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("span.pill", { hasText: "Publié" })).toBeVisible();
    await expect(page.locator("table").first()).toContainText("Poisson");
  });

  test("la vue Par catégorie affiche la substitution pour Bébés", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/menus?vue=categorie");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Bébés" }).click();
    await page.waitForLoadState("networkidle");
    const table = page.locator("table").first();
    await expect(table).toContainText("Poulet");
    await expect(table).toContainText("Poisson");
    await expect(table).toContainText("Adapté à l'âge (bébés)");
  });

  test("la vue Par enfant affiche le menu individuel de Kiivai", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/menus?vue=enfant");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /Kiivai/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Allergies déclarées")).toBeVisible();
    const table = page.locator("table").first();
    await expect(table).toContainText("👶 Individuel");
    await expect(table).toContainText("Compote");
  });

  test("la vue Alertes détecte les conflits allergènes non résolus", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/menus?vue=alertes");
    await page.waitForLoadState("networkidle");
    // Kiivai (allergie au lait) est en conflit à la fois lundi et mardi au
    // petit-déjeuner (les deux contiennent du lait sans adaptation individuelle) :
    // deux cartes d'alerte distinctes sont donc attendues.
    await expect(page.getByText(/Kiivai.*allergie à.*Protéines de lait de vache/).first()).toBeVisible();
    await expect(page.getByText(/Emma.*allergie à.*Gluten/).first()).toBeVisible();
  });

  test("le parent voit le menu du jour résolu avec le badge d'adaptation individuelle", async ({ page }) => {
    await connecter(page, "parent.demo@pitilink.local");
    await page.goto("/parent");
    await page.waitForLoadState("networkidle");
    // Un seul enfant rattaché à ce compte parent : /parent redirige directement
    // vers sa fiche, il n'y a donc pas de lien de liste à cliquer.
    if (!/\/parent\/enfants\//.test(page.url())) {
      await page.locator('a[href*="/parent/enfants/"]').first().click();
      await page.waitForLoadState("networkidle");
    }
    const url = new URL(page.url());
    const lundi = new Date();
    lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
    await page.goto(url.pathname + "?date=" + lundi.toISOString().slice(0, 10));
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("🍽️ Menu du jour")).toBeVisible();
    await expect(page.getByText("👶 adapté")).toBeVisible();
  });
});

test.describe("Menus — permissions", () => {
  test("un professionnel ne peut pas accéder à /direction/menus", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await page.goto("/direction/menus");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/pro$/);
  });

  test("un professionnel voit les menus en lecture seule, sans action de modification", async ({ page }) => {
    await connecter(page, "ana.demo@pitilink.local");
    await page.goto("/pro/menus?vue=semaine");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("table").first()).toContainText("Poisson");
    await expect(page.getByText("+ Ajouter")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enregistrer" })).toHaveCount(0);
  });
});

test.describe("Menus — création, édition et actions rapides", () => {
  // Semaines sans donnée seedée, dérivées de l'heure d'exécution pour ne
  // jamais entrer en collision avec la semaine courante ni avec l'état
  // laissé par une exécution précédente de la suite (la base de test n'est
  // pas réinitialisée entre deux lancements de `npm run test:e2e`).
  function lundiDecale(nSemaines: number): string {
    const base = new Date("2030-01-07T00:00:00.000Z"); // un lundi
    base.setUTCDate(base.getUTCDate() + nSemaines * 7);
    return base.toISOString().slice(0, 10);
  }
  const decalage = Math.floor(Date.now() / 1000) % 1000;
  const NOUVELLE_SEMAINE = lundiDecale(decalage * 2);

  test("créer une semaine vide, y ajouter un menu, la publier puis exiger une confirmation pour la modifier à nouveau", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto(`/direction/menus?date=${NOUVELLE_SEMAINE}&vue=semaine`);
    await page.waitForLoadState("networkidle");

    // Etat vide.
    await expect(page.getByText("Aucun menu pour cette semaine.")).toBeVisible();
    await page.getByRole("button", { name: "Créer cette semaine" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("span.pill", { hasText: "Brouillon" })).toBeVisible();

    // Ajout d'un menu général (Lundi, premier type de repas).
    await ouvrirFormulaire(page, "+ Ajouter");
    const formulaire = page.locator("details[open]").first();
    await formulaire.locator('input[name="alimentIds"]').nth(0).check();
    await formulaire.locator('input[name="alimentIds"]').nth(1).check();
    await formulaire.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForLoadState("networkidle");
    // Colonne Lundi (1re colonne de données, après celle du nom du repas).
    await expect(page.locator("table").first().locator("tbody tr").first().locator("td").nth(1)).not.toContainText("Aucun menu défini.");

    // Publication : la modification doit désormais exiger une confirmation.
    await page.getByRole("button", { name: "✓ Publier cette semaine" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("span.pill", { hasText: "Publié" })).toBeVisible();

    await ouvrirFormulaire(page, "Modifier");
    // .first() sur le <form> : le <details> contient aussi le petit formulaire
    // "Revenir au menu hérité" avec son propre champ caché de même nom.
    const formulairePublie = page.locator("details[open]").first().locator("form").first();
    await expect(formulairePublie.locator('input[name="confirmerModification"]')).toHaveAttribute("required", "");
    await formulairePublie.locator('input[name="confirmerModification"]').check();
    await formulairePublie.locator('textarea[name="note"]').fill("Note ajoutée après publication");
    await formulairePublie.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Note ajoutée après publication")).toHaveCount(0); // la note n'est pas affichée dans la grille, seul son enregistrement compte : pas d'erreur serveur.
  });

  test("copier un jour vers un autre jour de la même semaine", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto(`/direction/menus?date=${NOUVELLE_SEMAINE}&vue=semaine`);
    await page.waitForLoadState("networkidle");

    const tableAvant = page.locator("table").first();
    // Mercredi (3e jour, index colonne 3) doit être vide avant copie.
    await expect(tableAvant.locator("tbody tr").first().locator("td").nth(3)).toContainText("Aucun menu défini.");

    // nth(1) = 1re colonne de jour (Lundi), après la colonne "Repas".
    await page.locator("thead th").nth(1).getByText("⧉ Copier").click();
    const formulaireCopie = page.locator("details[open]").first();
    await formulaireCopie.locator('select[name="jourCible"]').selectOption({ label: "Mercredi" });
    await formulaireCopie.getByRole("button", { name: "OK" }).click();
    await page.waitForLoadState("networkidle");

    const tableApres = page.locator("table").first();
    await expect(tableApres.locator("tbody tr").first().locator("td").nth(3)).not.toContainText("Aucun menu défini.");
  });

  test("dupliquer la semaine vers une nouvelle date", async ({ page }) => {
    const CIBLE = lundiDecale(decalage * 2 + 1);
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto(`/direction/menus?date=${NOUVELLE_SEMAINE}&vue=semaine`);
    await page.waitForLoadState("networkidle");

    await page.getByText("📋 Dupliquer vers une autre semaine").click();
    const formulaireDupli = page.locator("details[open]").first();
    await formulaireDupli.locator('input[name="nouvelleDateDebut"]').fill(CIBLE);
    await formulaireDupli.getByRole("button", { name: "Dupliquer" }).click();
    await page.waitForLoadState("networkidle");

    await page.goto(`/direction/menus?date=${CIBLE}&vue=semaine`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("table").first().locator("tbody tr").first().locator("td").nth(1)).not.toContainText("Aucun menu défini.");
  });

  test("archiver une semaine bloque toute nouvelle modification", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto(`/direction/menus?date=${NOUVELLE_SEMAINE}&vue=semaine`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Archiver" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("span.pill", { hasText: "Archivé" })).toBeVisible();
    await expect(page.getByText("Modifier")).toHaveCount(0);
    await expect(page.getByText("+ Ajouter")).toHaveCount(0);
  });
});

test.describe("Menus — réglages", () => {
  test("ajouter un nouveau type de repas et un nouvel allergène", async ({ page }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/menus?vue=semaine");
    await page.waitForLoadState("networkidle");

    await page.getByText("⚙️ Réglages : aliments, allergènes, types de repas").click();

    // La liste des réglages (types de repas / allergènes) est le seul endroit
    // où le nouveau nom apparaît une seule fois — la grille hebdomadaire (qui
    // duplique son contenu entre versions desktop et mobile) le répète ailleurs.
    const nomType = `Collation-${Date.now()}`;
    const formulaireType = page.locator("form").filter({ has: page.locator('input[placeholder*="Collation"]') });
    await formulaireType.locator('input[name="nom"]').fill(nomType);
    await formulaireType.getByRole("button", { name: "+" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("li").filter({ hasText: nomType })).toBeVisible();

    const nomAllergene = `Sésame-${Date.now()}`;
    const formulaireAllergene = page.locator("form").filter({ has: page.locator('input[placeholder="Nouvel allergène"]') });
    await formulaireAllergene.locator('input[name="nom"]').fill(nomAllergene);
    await formulaireAllergene.getByRole("button", { name: "+" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("li").filter({ hasText: nomAllergene })).toBeVisible();
  });
});
