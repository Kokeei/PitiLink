import { test, expect, type Page } from "@playwright/test";

const MOT_DE_PASSE = "Password123!";

async function connecter(page: Page, email: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', MOT_DE_PASSE);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");
}

test.describe("Messagerie — un canal par enfant", () => {
  test("un parent et la direction échangent sur le canal de l'enfant", async ({ page, browser }) => {
    await connecter(page, "parent.demo@pitilink.local");
    await page.goto("/parent/messages");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /Kiivai Wong/ }).click();
    await page.waitForLoadState("networkidle");

    const messageParent = `Message parent ${Date.now()}`;
    await page.fill('textarea[name="contenu"]', messageParent);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(messageParent)).toBeVisible();

    const enfantId = new URL(page.url()).pathname.split("/").pop();

    const directionContext = await browser.newContext();
    const directionPage = await directionContext.newPage();
    await connecter(directionPage, "direction.demo@pitilink.local");
    await directionPage.goto(`/direction/messages/${enfantId}`);
    await directionPage.waitForLoadState("networkidle");
    await expect(directionPage.getByText(messageParent)).toBeVisible();

    const reponseDirection = `Réponse direction ${Date.now()}`;
    await directionPage.fill('textarea[name="contenu"]', reponseDirection);
    await directionPage.getByRole("button", { name: "Envoyer" }).click();
    await directionPage.waitForLoadState("networkidle");
    await expect(directionPage.getByText(reponseDirection)).toBeVisible();
    await directionContext.close();

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(reponseDirection)).toBeVisible();
  });

  test("une professionnelle non affectée à l'enfant n'a pas accès à son canal de messagerie", async ({ page, browser }) => {
    await connecter(page, "direction.demo@pitilink.local");
    await page.goto("/direction/enfants");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Kiivai" }).click();
    await page.waitForLoadState("networkidle");
    const enfantId = new URL(page.url()).pathname.split("/").pop();

    // julie.demo n'est affectée qu'à Noah dans le seed, pas à Kiivai : contexte
    // à part pour se connecter sous une autre identité que celle de `page`.
    const julieContext = await browser.newContext();
    const juliePage = await julieContext.newPage();
    await connecter(juliePage, "julie.demo@pitilink.local");
    await juliePage.goto(`/pro/messages/${enfantId}`);
    await juliePage.waitForLoadState("networkidle");
    await expect(juliePage.getByText("Page introuvable.")).toBeVisible();
    await julieContext.close();
  });
});
