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

  test("une professionnelle non affectée ne peut pas écrire sur le canal en appelant directement l'action serveur", async ({
    page,
    browser,
  }) => {
    // ana.demo est affectée à Kiivai : on capture la requête réelle que son
    // navigateur envoie en cliquant "Envoyer", pour la rejouer ensuite avec
    // les cookies de julie.demo (non affectée) — ça reproduit l'attaque
    // "appeler l'action serveur directement sans passer par l'UI", que le
    // 404 de lecture (test précédent) ne couvre pas côté écriture.
    await connecter(page, "ana.demo@pitilink.local");
    await page.goto("/pro/groupe");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Kiivai" }).click();
    await page.waitForURL(/\/pro\/enfants\//);
    const enfantId = new URL(page.url()).pathname.split("/").pop();

    await page.goto(`/pro/messages/${enfantId}`);
    await page.waitForLoadState("networkidle");

    const messageAttaque = `Message forgé ${Date.now()}`;
    await page.fill('textarea[name="contenu"]', messageAttaque);

    const [requeteAction] = await Promise.all([
      page.waitForRequest((req) => req.method() === "POST" && req.url().includes(`/pro/messages/${enfantId}`)),
      page.getByRole("button", { name: "Envoyer" }).click(),
    ]);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(messageAttaque)).toBeVisible();

    // julie.demo n'est affectée qu'à Noah : on rejoue la même requête (même
    // corps, mêmes en-têtes Next-Action) mais authentifiée comme elle — en
    // remplaçant le cookie de session d'ana par celui de julie, sinon la
    // relecture authentifierait la requête comme ana et ne testerait rien.
    const julieContext = await browser.newContext();
    const juliePage = await julieContext.newPage();
    await connecter(juliePage, "julie.demo@pitilink.local");
    const cookieJulie = (await julieContext.cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const messageForge = `Message forgé par julie ${Date.now()}`;
    const corpsOriginal = requeteAction.postData() ?? "";
    const corpsForge = corpsOriginal.replace(messageAttaque, messageForge);

    // Retire content-length (recalculé par Playwright pour le nouveau corps,
    // de taille différente) et host/connection (gérés par le client HTTP).
    const entetes: Record<string, string> = { ...requeteAction.headers(), cookie: cookieJulie };
    delete entetes["content-length"];
    delete entetes["host"];
    delete entetes["connection"];

    const reponse = await juliePage.request.post(requeteAction.url(), {
      headers: entetes,
      data: corpsForge,
    });
    await reponse.text().catch(() => {});

    // La direction (toujours participante) ne doit jamais voir ce message :
    // la protection doit avoir empêché sa création en base.
    const directionContext = await browser.newContext();
    const directionPage = await directionContext.newPage();
    await connecter(directionPage, "direction.demo@pitilink.local");
    await directionPage.goto(`/direction/messages/${enfantId}`);
    await directionPage.waitForLoadState("networkidle");
    await expect(directionPage.getByText(messageForge)).toHaveCount(0);

    await julieContext.close();
    await directionContext.close();
  });
});
