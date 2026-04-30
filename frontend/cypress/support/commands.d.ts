/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(options?: {
        email?: string;
        password?: string;
        redirectTo?: string;
        skipRedirect?: boolean;
        cacheAcrossSpecs?: boolean;
      }): Chainable<void>;
    }
  }
}

export {};
