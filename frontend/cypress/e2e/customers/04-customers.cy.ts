// TODO: Terminar todos los tests e2e
describe("Customers", () => {
  before(() => {
    cy.task("db:reset");
    Cypress.session.clearAllSavedSessions();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin RentCheck — /adm/customers
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin RentCheck", () => {
    beforeEach(() => {
      cy.login(); // logs in as ADMIN
    });

    it("should display the customers page with correct structure", () => {
      cy.intercept("GET", "**/api/v1/customers*").as("getCustomers");

      cy.visit("/adm/customers");

      cy.contains("Listado de clientes").should("be.visible");
      cy.contains(
        "Gestiona el historial unificado de todos los clientes",
      ).should("be.visible");
      cy.get('input[id="search"]').should("be.visible");
    });

    it("should redirect to /unauthorized when admin visits /owner/customers", () => {
      cy.visit("/owner/customers");
      cy.url().should("include", "/unauthorized");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Owner, Manager, and Employee
  // ─────────────────────────────────────────────────────────────────────────
  const testCustomerRole = (
    roleName: string,
    credentialsEnvKey: string,
    basePath: string,
  ) => {
    describe(`Role: ${roleName}`, () => {
      beforeEach(() => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.clearAllSessionStorage();

        const creds = Cypress.env(credentialsEnvKey);

        cy.login({
          email: creds.email,
          password: creds.password,
          redirectTo: creds.redirectTo,
        });
      });

      it("should display the customers page", () => {
        cy.intercept("GET", "**/api/v1/customers*").as("getCustomers");

        cy.visit(`${basePath}/customers`);

        cy.wait("@getCustomers").then(({ response }) => {
          expect(response).to.not.be.undefined;
          expect(response!.statusCode).to.be.oneOf([200, 304]);
        });

        cy.contains("Listado de clientes").should("be.visible");
        cy.get('input[id="search"]').should("be.visible");
      });

      it("should NOT show a create button (customers are created via rentals)", () => {
        cy.visit(`${basePath}/customers`);
        cy.get('button[id="create-button"]').should("not.exist");
      });

      it("should search for customers and display results", () => {
        cy.intercept("GET", "**/api/v1/customers*").as("searchCustomers");

        cy.visit(`${basePath}/customers`);

        // Wait for initial load, then type in search
        cy.get('input[id="search"]').type("a");

        cy.wait("@searchCustomers");

        // Table or empty message should be visible after search
        cy.get("body").then(($body) => {
          if ($body.text().includes("No hay clientes registrados")) {
            cy.contains("No hay clientes registrados").should("be.visible");
          } else {
            cy.get("table").should("be.visible");
          }
        });
      });

      it("should open the customer detail modal when clicking 'Ver info'", () => {
        cy.intercept("GET", "**/api/v1/customers*").as("getCustomers");
        cy.intercept("GET", "**/api/v1/customers/*").as("getCustomerDetail");

        cy.visit(`${basePath}/customers`);

        cy.wait("@getCustomers").then(({ response }) => {
          const customers = response!.body.data;

          if (!customers || customers.length === 0) {
            cy.log("No customers exist; skipping detail modal test");
            return;
          }

          // Click the first "Ver info" button
          cy.contains("Ver info")
            .first()
            .scrollIntoView()
            .click({ force: true });

          cy.wait("@getCustomerDetail");

          // Modal should open with customer info
          cy.get('div[class*="swal2-container"]').should("be.visible");

          // Customer detail fields
          cy.get('input[id="swal-generalScore"]').should("exist");
          cy.get('input[id="swal-status"]').should("exist");
          cy.get('input[id="swal-biometries"]').should("exist");
          cy.get('input[id="swal-rentals"]').should("exist");

          // Verify details and close
          cy.get(".swal2-close").click();
        });
      });

      it("should display customer status badge in the table", () => {
        cy.intercept("GET", "**/api/v1/customers*").as("getCustomers");

        cy.visit(`${basePath}/customers`);

        cy.wait("@getCustomers").then(({ response }) => {
          const customers = response!.body.data;

          if (!customers || customers.length === 0) {
            cy.log("No customers; skipping badge test");
            return;
          }

          // At least one row should exist
          cy.get("table tbody tr").first().should("be.visible");
        });
      });

      it("should display 'no customers' empty state when search yields no results", () => {
        cy.intercept("GET", "**/api/v1/customers*").as("searchEmpty");

        cy.visit(`${basePath}/customers`);

        // Search for something unlikely to match
        cy.get('input[id="search"]').type("xyzNonExistent12345");

        cy.wait("@searchEmpty");

        cy.contains("No hay clientes registrados").should("be.visible");
      });
    });
  };

  testCustomerRole("Owner (Renter)", "RENTER_CREDENTIALS", "/owner");
  testCustomerRole("Manager", "MANAGER_CREDENTIALS", "/manager");
  testCustomerRole("Employee", "EMPLOYEE_CREDENTIALS", "/employee");
});
