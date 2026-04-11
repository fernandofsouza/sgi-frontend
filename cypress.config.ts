import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // CYPRESS_BASE_URL sobrescreve em CI (Heroku) e produção
    baseUrl: process.env['CYPRESS_BASE_URL'] || 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    retries: { runMode: 2, openMode: 0 },
    env: {
      apiUrl: 'http://localhost:8080/api',
    },
  },
});
