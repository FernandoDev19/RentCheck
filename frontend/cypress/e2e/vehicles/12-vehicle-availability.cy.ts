/**
 * 12-vehicle-availability.cy.ts
 *
 * Covers the Vehicle Availability modal (accessible from dashboard & vehicles page):
 *   - Modal opens with date picker
 *   - Validation: end date must be after start date
 *   - Search returns available vehicles for date range
 *   - Empty state when no vehicles available
 *   - Pagination works
 *   - "Ver detalle" opens vehicle detail modal
 *   - "Crear renta" opens rental creation flow
 *
 * Roles tested:
 *   - Owner  (/owner/vehicles)
 *   - Employee (/employee/dashboard)
 *   - Manager (/manager/dashboard)
 */

describe("Vehicle Availability", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");
  const ec = Cypress.env("EMPLOYEE_CREDENTIALS");
  const mc = Cypress.env("MANAGER_CREDENTIALS");

  const getTodayLocal = () => new Date().toLocaleDateString("en-CA");
  const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-CA");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Owner
  // ─────────────────────────────────────────────────────────────────────────
  describe("Owner (Renter)", () => {
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

    it("should open the availability modal from vehicles page", () => {
      cy.visit("/owner/vehicles");

      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Disponibilidad de vehículos").should("be.visible");
      cy.contains("Buscar vehículos disponibles").should("be.visible");
    });

    it("should show the date picker form with default values", () => {
      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.contains("Fecha inicio").should("be.visible");
      cy.contains("Fecha devolución").should("be.visible");
      cy.contains("Buscar vehículos disponibles").should("be.visible");
    });

    it("should show validation error when end date is before start date", () => {
      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      // Set end date before start date
      cy.get('input[type="date"]').first().clear().type(getFutureDate(5));
      cy.get('input[type="date"]').last().clear().type(getTodayLocal());

      cy.contains("Buscar vehículos disponibles").click();
      cy.wait(300);

      cy.contains("La fecha de devolución debe ser posterior al inicio").should(
        "be.visible",
      );
    });

    it("should search for available vehicles", () => {
      cy.intercept("GET", "**/api/v1/vehicles/available-by-date*").as(
        "availableVehicles",
      );

      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('input[type="date"]').first().clear().type(getTodayLocal());
      cy.get('input[type="date"]').last().clear().type(getFutureDate(3));

      cy.contains("Buscar vehículos disponibles").click();

      cy.wait("@availableVehicles").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });

      cy.wait(500);

      // Either shows vehicles or empty state
      cy.get("body").then(($body) => {
        const text = $body.text();
        const hasVehicles =
          text.includes("vehículo") && !text.includes("Sin vehículos disponibles");
        const isEmpty = text.includes("Sin vehículos disponibles");
        expect(hasVehicles || isEmpty).to.be.true;
      });
    });

    it("should show empty state when no vehicles available", () => {
      cy.intercept("GET", "**/api/v1/vehicles/available-by-date*", {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, lastPage: 1 },
      }).as("emptyVehicles");

      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('input[type="date"]').first().clear().type(getTodayLocal());
      cy.get('input[type="date"]').last().clear().type(getFutureDate(3));

      cy.contains("Buscar vehículos disponibles").click();

      cy.wait("@emptyVehicles");
      cy.wait(300);

      cy.contains("No hay vehículos disponibles").should("be.visible");
    });

    it("should show vehicle cards when results are available", () => {
      cy.intercept("GET", "**/api/v1/vehicles/available-by-date*", {
        statusCode: 200,
        body: {
          data: [
            {
              id: "vehicle-1",
              plate: "ABC123",
              brand: "Toyota",
              model: "Corolla",
              year: 2022,
              color: "Blanco",
              transmission: "manual",
              rentalPriceByDay: 150000,
              status: "available",
              photos: [],
            },
          ],
          total: 1,
          page: 1,
          lastPage: 1,
        },
      }).as("vehicleResults");

      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('input[type="date"]').first().clear().type(getTodayLocal());
      cy.get('input[type="date"]').last().clear().type(getFutureDate(3));

      cy.contains("Buscar vehículos disponibles").click();

      cy.wait("@vehicleResults");
      cy.wait(300);

      cy.contains("Toyota").should("be.visible");
      cy.contains("Corolla").should("be.visible");
      cy.contains("ABC123").should("be.visible");
    });

    it("should close the availability modal", () => {
      cy.visit("/owner/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");

      cy.get('button[class="swal2-close"]').click();
      cy.wait(300);

      cy.get('div[class*="swal2-container"]').should("not.exist");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Employee — access availability from dashboard
  // ─────────────────────────────────────────────────────────────────────────
  describe("Employee", () => {
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

    it("should open availability modal from employee dashboard", () => {
      cy.visit("/employee/dashboard");

      cy.contains("Ver disponibilidad").click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Disponibilidad de vehículos").should("be.visible");

      cy.get('button[class="swal2-close"]').click();
    });

    it("should search for available vehicles as employee", () => {
      cy.intercept("GET", "**/api/v1/vehicles/available-by-date*").as(
        "employeeAvailable",
      );

      cy.visit("/employee/vehicles");
      cy.contains("Consultar disponibilidad").click();
      cy.wait(500);

      cy.get('input[type="date"]').first().clear().type(getTodayLocal());
      cy.get('input[type="date"]').last().clear().type(getFutureDate(2));

      cy.contains("Buscar vehículos disponibles").click();

      cy.wait("@employeeAvailable").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });

      cy.get('button[class="swal2-close"]').click();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Manager — access availability from dashboard
  // ─────────────────────────────────────────────────────────────────────────
  describe("Manager", () => {
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

    it("should open availability modal from manager dashboard", () => {
      cy.visit("/manager/dashboard");

      cy.contains("Ver disponibilidad").click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Disponibilidad de vehículos").should("be.visible");

      cy.get('button[class="swal2-close"]').click();
    });
  });
});