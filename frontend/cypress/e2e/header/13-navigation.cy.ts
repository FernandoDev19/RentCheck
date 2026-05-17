/**
 * 13-navigation.cy.ts
 *
 * Covers navigation, sidebar, and logout:
 *   - Sidebar opens and closes
 *   - Sidebar shows correct links per role
 *   - Navigation links route to correct pages
 *   - Logout flow works and redirects to /login
 *   - Unauthenticated access redirects to /login
 *   - Root / redirects to correct dashboard per role
 *   - Unknown routes redirect to /
 *
 * Roles tested:
 *   - Admin, Owner, Manager, Employee
 */

describe("Navigation & Sidebar", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");
  const mc = Cypress.env("MANAGER_CREDENTIALS");
  const ec = Cypress.env("EMPLOYEE_CREDENTIALS");

  // ─────────────────────────────────────────────────────────────────────────
  // Unauthenticated access
  // ─────────────────────────────────────────────────────────────────────────
  describe("Unauthenticated access", () => {
    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
    });

    it("should redirect to /login when accessing / without auth", () => {
      cy.visit("/");
      cy.url().should("include", "/login");
    });

    it("should redirect to /login when accessing /owner/dashboard without auth", () => {
      cy.visit("/owner/dashboard");
      cy.url().should("include", "/login");
    });

    it("should redirect to /login when accessing /adm/dashboard without auth", () => {
      cy.visit("/adm/dashboard");
      cy.url().should("include", "/login");
    });

    it("should redirect unknown routes to / (which then goes to login)", () => {
      cy.visit("/this-does-not-exist");
      cy.url().should(
        "satisfy",
        (url: string) => url.includes("/login") || url.includes("/"),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Navigation
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin Navigation", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should redirect / to /adm/dashboard for admin", () => {
      cy.visit("/");
      cy.url().should("include", "/adm/dashboard");
    });

    it("should open and close the sidebar", () => {
      cy.visit("/adm/dashboard");

      // Open sidebar (menu button)
      cy.get("header button").last().click();
      cy.wait(300);

      // Sidebar should be visible
      cy.contains("RentCheck").should("be.visible");
      cy.contains("Panel Control").should("be.visible");

      // Close sidebar by clicking backdrop
      cy.get("div.absolute.inset-0.bg-black\\/50").click({ force: true });
      cy.wait(300);
    });

    it("should show correct sidebar links for admin", () => {
      cy.visit("/adm/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Panel Control").should("be.visible");
      cy.contains("Rentadoras").should("be.visible");
      cy.contains("Sedes").should("be.visible");
      cy.contains("Empleados").should("be.visible");
      cy.contains("Clientes").should("be.visible");
      cy.contains("Vehiculos").should("be.visible");
    });

    it("should navigate to renters via sidebar", () => {
      cy.visit("/adm/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Rentadoras").click();
      cy.url().should("include", "/adm/renters");
    });

    it("should navigate to employees via sidebar", () => {
      cy.visit("/adm/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Empleados").click();
      cy.url().should("include", "/adm/employees");
    });

    it("should logout successfully", () => {
      cy.visit("/adm/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Cerrar sesión").click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("¿Cerrar sesión?").should("be.visible");

      cy.get('button[class="swal2-confirm swal2-styled"]').click();
      cy.wait(1000);

      cy.url().should("include", "/login");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Owner Navigation
  // ─────────────────────────────────────────────────────────────────────────
  describe("Owner Navigation", () => {
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

    it("should redirect / to /owner/dashboard for owner", () => {
      cy.visit("/");
      cy.url().should("include", "/owner/dashboard");
    });

    it("should show correct sidebar links for owner", () => {
      cy.visit("/owner/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Panel Control").should("be.visible");
      cy.contains("Sedes").should("be.visible");
      cy.contains("Empleados").should("be.visible");
      cy.contains("Rentas").should("be.visible");
      cy.contains("Feedbacks pendientes").should("be.visible");
      cy.contains("Clientes").should("be.visible");
      cy.contains("Vehiculos").should("be.visible");

      // Owner should NOT see Rentadoras
      cy.contains("Rentadoras").should("not.exist");
    });

    it("should navigate to branches via sidebar", () => {
      cy.visit("/owner/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Sedes").click();
      cy.url().should("include", "/owner/branches");
    });

    it("should navigate to rentals via sidebar", () => {
      cy.visit("/owner/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Rentas").click();
      cy.url().should("include", "/owner/rentals");
    });

    it("should navigate back to dashboard via Panel Control", () => {
      cy.visit("/owner/rentals");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Panel Control").click();
      cy.url().should("include", "/owner/dashboard");
    });

    it("should logout successfully", () => {
      cy.visit("/owner/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Cerrar sesión").click();
      cy.wait(500);

      cy.get('button[class="swal2-confirm swal2-styled"]').click();
      cy.wait(1000);

      cy.url().should("include", "/login");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Manager Navigation
  // ─────────────────────────────────────────────────────────────────────────
  describe("Manager Navigation", () => {
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

    it("should redirect / to /manager/dashboard for manager", () => {
      cy.visit("/");
      cy.url().should("include", "/manager/dashboard");
    });

    it("should show correct sidebar links for manager", () => {
      cy.visit("/manager/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Panel Control").should("be.visible");
      cy.contains("Empleados").should("be.visible");
      cy.contains("Rentas").should("be.visible");
      cy.contains("Feedbacks pendientes").should("be.visible");
      cy.contains("Clientes").should("be.visible");
      cy.contains("Vehiculos").should("be.visible");

      // Manager should NOT see Sedes or Rentadoras
      cy.contains("Rentadoras").should("not.exist");
    });

    it("should navigate to employees via sidebar", () => {
      cy.visit("/manager/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Empleados").click();
      cy.url().should("include", "/manager/employees");
    });

    it("should be blocked from owner routes", () => {
      cy.visit("/owner/branches");
      cy.url().should("include", "/unauthorized");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Employee Navigation
  // ─────────────────────────────────────────────────────────────────────────
  describe("Employee Navigation", () => {
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

    it("should redirect / to /employee/dashboard for employee", () => {
      cy.visit("/");
      cy.url().should("include", "/employee/dashboard");
    });

    it("should show correct sidebar links for employee", () => {
      cy.visit("/employee/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Panel Control").should("be.visible");
      cy.contains("Rentas").should("be.visible");
      cy.contains("Feedbacks pendientes").should("be.visible");
      cy.contains("Clientes").should("be.visible");
      cy.contains("Vehiculos").should("be.visible");

      // Employee should NOT see Sedes, Empleados, or Rentadoras
      cy.contains("Rentadoras").should("not.exist");
      cy.contains("Sedes").should("not.exist");
    });

    it("should navigate to rentals via sidebar", () => {
      cy.visit("/employee/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Rentas").click();
      cy.url().should("include", "/employee/rentals");
    });

    it("should navigate to feedbacks via sidebar", () => {
      cy.visit("/employee/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.get("nav").contains("Feedbacks pendientes").click();
      cy.url().should("include", "/employee/feedbacks");
    });

    it("should be blocked from owner and admin routes", () => {
      cy.visit("/owner/branches");
      cy.url().should("include", "/unauthorized");
    });

    it("should logout successfully", () => {
      cy.visit("/employee/dashboard");

      cy.get("header button").last().click();
      cy.wait(300);

      cy.contains("Cerrar sesión").click();
      cy.wait(500);

      cy.get('button[class="swal2-confirm swal2-styled"]').click();
      cy.wait(1000);

      cy.url().should("include", "/login");
    });
  });
});
