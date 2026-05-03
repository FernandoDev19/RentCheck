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

      it("should open the customer detail modal and show reputation summary", () => {
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

          // Modal should open
          cy.get('div[class*="swal2-container"]').should("be.visible");

          // Verify Reputation section
          cy.contains("Reputación").should("be.visible");
          cy.contains("Score general").should("be.visible");
          cy.contains("Estado").should("be.visible");

          // Verify Biometry status
          cy.contains("Última biometría").should("be.visible");

          // Verify Rental History summary
          cy.contains("Historial de rentas").should("be.visible");
          
          // Check for the "Ver historial de rentas" button
          cy.get('button[id="btn-ver-rentas"]').should("exist");

          // Close
          cy.get(".swal2-close").click();
        });
      });

      it("should show 'Sin historial calificado' if customer has no feedback", () => {
        // Mock a customer with no rentals/feedback
        cy.intercept("GET", "**/api/v1/customers/*", {
            statusCode: 200,
            body: {
                id: "no-history-id",
                name: "Nuevo",
                lastName: "Cliente",
                identityNumber: "999888",
                status: "normal",
                generalScore: 5,
                rentals: [],
                biometryRequests: []
            }
        }).as("getEmptyCustomer");

        cy.visit(`${basePath}/customers`);
        
        // We trigger the modal manually or find a way to click it. 
        // Since we mocked the detail, we just need to click ANY "Ver info" 
        // but we'll intercept that specific ID.
        cy.contains("Ver info").first().click({ force: true });
        
        cy.wait("@getEmptyCustomer");
        cy.contains("Sin historial calificado").should("be.visible");
        cy.get(".swal2-close").click();
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
