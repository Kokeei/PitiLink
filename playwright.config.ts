import { defineConfig, devices } from "@playwright/test";

/**
 * Prérequis avant de lancer `npm run test:e2e` :
 * - PostgreSQL local démarré et migré (`npx prisma migrate deploy`)
 * - Base seedée avec les comptes de démonstration (`npx prisma db seed`)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Échappatoire pour les environnements où le binaire Chromium préinstallé
    // ne correspond pas à la révision attendue par cette version de
    // @playwright/test (sinon laisser `npx playwright install` gérer ça).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
