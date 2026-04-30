/// <reference types="node" />
import { defineConfig } from "cypress";
import { exec } from 'child_process';

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 1,
      openMode: 0
    },
    env: {
      apiUrl: "http://localhost:3000/api/v1"
    },
    setupNodeEvents(on, config) {
      on('task', {
        'db:reset'() {
          return new Promise((resolve, reject) => {
            exec('cd ../backend && npm run seed:mvp', (error, stdout, stderr) => {
              if (error) {
                console.error(stderr);
                return reject(error);
              }

              console.log(stdout);
              resolve(null);
            });
          });
        }
      });
    },
  },
});
