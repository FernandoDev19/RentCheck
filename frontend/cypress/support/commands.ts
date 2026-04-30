/// <reference types="cypress" />
/// <reference path="./commands.d.ts" />

type LoginOptions = {
    email?: string;
    password?: string;
    redirectTo?: string;
    skipRedirect?: boolean;
    cacheAcrossSpecs?: boolean;
}

const DEFAULT_ADMIN = {
    email: "admin@rentcheck.com",
    password: "123456"
}

Cypress.Commands.add('login', (options: LoginOptions = {}) => {
    const ADMIN_EMAIL = Cypress.env('ADMIN_EMAIL');
    const ADMIN_PASSWORD = Cypress.env('ADMIN_PASSWORD');
    
    const credentials = {
        email: options.email ?? ADMIN_EMAIL ?? DEFAULT_ADMIN.email,
        password: options.password ?? ADMIN_PASSWORD ?? DEFAULT_ADMIN.password
    }

    const destination = options.redirectTo ?? "/adm/dashboard"
    
    cy.session(
        ['login', credentials.email, destination],
        () => {
            cy.visit('/login');
            cy.get('input[name="email"]').clear().type(credentials.email);
            cy.get('input[name="password"]').clear().type(credentials.password, { log: false });
            cy.get('button[type="submit"]').click();
            cy.url().should('include', destination);
        },
        {
            cacheAcrossSpecs: options.cacheAcrossSpecs ?? true
        }
    );

    if (!options.skipRedirect) {
        cy.visit(destination);
    }
});

export {};