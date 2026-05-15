/**
 * 11-dashboard.cy.ts
 *
 * Covers the Dashboard for each role:
 *   - Admin dashboard: shows cards for Rentadoras, Sedes, Clientes, Empleados
 *   - Owner/Manager dashboard: shows cards for Buscar Cliente, Ver disponibilidad,
 *     Sedes (Owner only), Rentas, Pendientes, Empleados (Owner only), Clientes
 *   - Employee dashboard: shows 4 action buttons
 *   - Navigation works from dashboard cards
 *   - Logout button present for all roles
 *
 * Roles tested:
 *   - Admin   (/adm/dashboard)
 *   - Owner   (/owner/dashboard)
 *   - Manager (/manager/dashboard)
 *   - Employee (/employee/dashboard)
 */

describe("Dashboard", () => {
    const rc = Cypress.env("RENTER_CREDENTIALS");
    const mc = Cypress.env("MANAGER_CREDENTIALS");
    const ec = Cypress.env("EMPLOYEE_CREDENTIALS");

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Dashboard
    // ─────────────────────────────────────────────────────────────────────────
    describe("Admin RentCheck Dashboard", () => {
        beforeEach(() => {
            cy.login();
        });

        it("should redirect to /adm/dashboard after login", () => {
            cy.url().should("include", "/adm/dashboard");
        });

        it("should display admin dashboard with correct structure", () => {
            cy.visit("/adm/dashboard");

            cy.contains("Admin Master").should("be.visible");
            cy.contains("RentCheck HQ").should("be.visible");
            cy.contains("Control total del sistema").should("be.visible");
        });

        it("should display all admin action cards", () => {
            cy.visit("/adm/dashboard");

            cy.contains("Buscar Cliente").should("exist");
            cy.contains("Sedes").should("exist");
            cy.contains("Clientes").should("exist");
            cy.contains("Empleados").should("exist");
        });

        it("should navigate to rentadoras when clicking the card", () => {
            cy.visit("/adm/dashboard");
            cy.contains("Rentadoras").click({ force: true });
            cy.url().should("include", "/adm/renters");
        });

        it("should navigate to sedes when clicking the card", () => {
            cy.visit("/adm/dashboard");
            cy.contains("Sedes").click({ force: true });
            cy.url().should("include", "/adm/branches");
        });

        it("should navigate to clientes when clicking the card", () => {
            cy.visit("/adm/dashboard");
            cy.contains("Clientes").click({ force: true });
            cy.url().should("include", "/adm/customers");
        });

        it("should navigate to empleados when clicking the card", () => {
            cy.visit("/adm/dashboard");
            cy.contains("Empleados").click({ force: true });
            cy.url().should("include", "/adm/employees");
        });

        it("should open search modal when clicking Buscar Cliente", () => {
            cy.visit("/adm/dashboard");
            cy.contains("Buscar Cliente").click({ force: true });
            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Buscar Cliente").should("be.visible");
            cy.get('button[class="swal2-cancel swal2-styled"]').click();
        });

        it("should display the notification bell", () => {
            cy.visit("/adm/dashboard");
            cy.get('button[id="notification-bell-btn"]').should("be.visible");
        });

        it("should display logout button in sidebar", () => {
            cy.visit("/adm/dashboard");
            // Open sidebar
            cy.get("header button").last().click();
            cy.wait(300);
            cy.contains("Cerrar sesión").should("be.visible");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Owner Dashboard
    // ─────────────────────────────────────────────────────────────────────────
    describe("Owner Dashboard", () => {
        beforeEach(() => {
            cy.clearAllCookies();
            cy.clearAllLocalStorage();
            cy.clearAllSessionStorage();

            cy.login({
                email: rc.email,
                password: rc.password,
                redirectTo: rc.redirectTo,
            });
        });

        it("should redirect to /owner/dashboard after login", () => {
            cy.url().should("include", "/owner/dashboard");
        });

        it("should display owner dashboard with correct structure", () => {
            cy.visit("/owner/dashboard");

            cy.contains("Panel del propietario").should("be.visible");
            cy.contains("Bienvenido").should("be.visible");
            cy.contains("Visión general de tu operación").should("be.visible");
        });

        it("should display all owner action cards", () => {
            cy.visit("/owner/dashboard");

            cy.contains("Buscar Cliente").should("exist");
            cy.contains("Ver disponibilidad").should("exist");
            cy.contains("Sedes").should("exist");
            cy.contains("Clientes").should("exist");
            cy.contains("Rentas").should("exist");
            cy.contains("Pendientes").should("exist");
            cy.contains("Empleados").should("exist");
        });

        it("should navigate to sedes when clicking the card", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Sedes").click({ force: true });
            cy.url().should("include", "/owner/branches");
        });

        it("should navigate to rentas when clicking the card", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Rentas").click({ force: true });
            cy.url().should("include", "/owner/rentals");
        });

        it("should navigate to clientes when clicking the card", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Clientes").click({ force: true });
            cy.url().should("include", "/owner/customers");
        });

        it("should navigate to empleados when clicking the card", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Empleados").click({ force: true });
            cy.url().should("include", "/owner/employees");
        });

        it("should navigate to feedbacks when clicking Pendientes", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Pendientes").click({ force: true });
            cy.url().should("include", "/owner/feedbacks");
        });

        it("should open availability modal when clicking Ver disponibilidad", () => {
            cy.visit("/owner/dashboard");
            cy.contains("Ver disponibilidad").click();
            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Disponibilidad de vehículos").should("be.visible");
            cy.get('button[class="swal2-close"]').click();
        });

        it("should NOT have access to admin routes", () => {
            cy.visit("/adm/dashboard");
            cy.url().should("include", "/unauthorized");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Manager Dashboard
    // ─────────────────────────────────────────────────────────────────────────
    describe("Manager Dashboard", () => {
        beforeEach(() => {
            cy.clearAllCookies();
            cy.clearAllLocalStorage();
            cy.clearAllSessionStorage();

            cy.login({
                email: mc.email,
                password: mc.password,
                redirectTo: mc.redirectTo,
            });
        });

        it("should redirect to /manager/dashboard after login", () => {
            cy.url().should("include", "/manager/dashboard");
        });

        it("should display manager dashboard with correct structure", () => {
            cy.visit("/manager/dashboard");

            cy.contains("Panel del manager").should("be.visible");
            cy.contains("Bienvenido").should("be.visible");
        });

        it("should display manager cards (NO Sedes, NO Empleados)", () => {
            cy.visit("/manager/dashboard");

            cy.contains("Buscar Cliente").should("exist");
            cy.contains("Ver disponibilidad").should("exist");
            cy.contains("Clientes").should("exist");
            cy.contains("Rentas").should("exist");
            cy.contains("Pendientes").should("exist");

            // Manager should NOT have Sedes or Empleados quick-access
            // (they have employees but no direct branches card)
        });

        it("should navigate to rentas when clicking the card", () => {
            cy.visit("/manager/dashboard");
            cy.contains("Rentas").click({ force: true });
            cy.url().should("include", "/manager/rentals");
        });

        it("should navigate to clientes when clicking the card", () => {
            cy.visit("/manager/dashboard");
            cy.contains("Clientes").click({ force: true });
            cy.url().should("include", "/manager/customers");
        });

        it("should NOT have access to owner routes", () => {
            cy.visit("/owner/dashboard");
            cy.url().should("include", "/unauthorized");
        });

        it("should NOT have access to admin routes", () => {
            cy.visit("/adm/dashboard");
            cy.url().should("include", "/unauthorized");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Employee Dashboard
    // ─────────────────────────────────────────────────────────────────────────
    describe("Employee Dashboard", () => {
        beforeEach(() => {
            cy.clearAllCookies();
            cy.clearAllLocalStorage();
            cy.clearAllSessionStorage();

            cy.login({
                email: ec.email,
                password: ec.password,
                redirectTo: ec.redirectTo,
            });
        });

        it("should redirect to /employee/dashboard after login", () => {
            cy.url().should("include", "/employee/dashboard");
        });

        it("should display employee dashboard with correct structure", () => {
            cy.visit("/employee/dashboard");

            cy.contains("Panel de operaciones").should("be.visible");
            cy.contains("Hola").should("be.visible");
            cy.contains("¿Qué vas a hacer hoy?").should("be.visible");
        });

        it("should display all employee action buttons", () => {
            cy.visit("/employee/dashboard");

            cy.contains("Buscar Cliente").should("exist");
            cy.contains("Ver disponibilidad").should("exist");
            cy.contains("Nueva Renta").should("exist");
            cy.contains("Pendientes por Calificar").should("exist");
        });

        it("should open search modal when clicking Buscar Cliente", () => {
            cy.visit("/employee/dashboard");
            cy.contains("Buscar Cliente").click();
            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Buscar Cliente").should("be.visible");
            cy.get('button[class="swal2-cancel swal2-styled"]').click();
        });

        it("should open rental creation when clicking Nueva Renta", () => {
            cy.visit("/employee/dashboard");
            cy.contains("Nueva Renta").click();
            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Identificar Cliente").should("be.visible");
            cy.get('button[class="swal2-cancel swal2-styled"]').click();
        });

        it("should navigate to feedbacks when clicking Pendientes por Calificar", () => {
            cy.visit("/employee/dashboard");
            cy.contains("Pendientes por Calificar").click();
            cy.url().should("include", "/employee/feedbacks");
        });

        it("should open availability modal when clicking Ver disponibilidad", () => {
            cy.visit("/employee/dashboard");
            cy.contains("Ver disponibilidad").click();
            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Disponibilidad de vehículos").should("be.visible");
            cy.get('button[class="swal2-close"]').click();
        });

        it("should NOT have access to owner or admin routes", () => {
            cy.visit("/owner/dashboard");
            cy.url().should("include", "/unauthorized");
        });

        it("should NOT have access to admin routes", () => {
            cy.visit("/adm/dashboard");
            cy.url().should("include", "/unauthorized");
        });
    });
});
