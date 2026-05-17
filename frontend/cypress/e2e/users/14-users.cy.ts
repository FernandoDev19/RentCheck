describe("Users", () => {
  before(() => {
    cy.task("db:reset");
    Cypress.session.clearAllSavedSessions();
  });

  beforeEach(() => {
    cy.login(); // Logs in as ADMIN
  });

  it("should display the system users page with correct structure", () => {
    cy.intercept("GET", "**/api/v1/users*").as("getUsers");

    cy.visit("/adm/users");

    cy.contains("Usuarios del sistema").should("be.visible");
    cy.contains("Visualiza y gestiona todos los usuarios registrados en RentCheck").should("be.visible");
    cy.get('input[placeholder="Buscar por nombre o email..."]').should("be.visible");

    cy.wait("@getUsers").then(({ response }) => {
      expect(response!.statusCode).to.be.oneOf([200, 304]);
      cy.get("table").should("be.visible");
    });
  });

  it("should open user details modal", () => {
    cy.intercept("GET", "**/api/v1/users*").as("getUsers");

    cy.visit("/adm/users");

    cy.wait("@getUsers");

    // Click "Ver detalle" on the first row
    cy.contains("Ver detalle").first().click({ force: true });

    // Detail SweetAlert modal should open
    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("Email").should("be.visible");
    cy.contains("Rol").should("be.visible");
    cy.contains("Estado").should("be.visible");
    cy.contains("ID").should("be.visible");

    // Close the modal
    cy.get(".swal2-close").click();
  });

  it("should allow search filtering and role buttons filtering", () => {
    cy.intercept("GET", "**/api/v1/users*").as("getUsers");

    cy.visit("/adm/users");

    cy.wait("@getUsers");

    // Filter by typing a search
    cy.get('input[placeholder="Buscar por nombre o email..."]').type("admin");
    cy.contains("admin@rentcheck.com").should("be.visible");

    // Filter by role buttons
    cy.contains("Employee").click();
    cy.get("body").then(($body) => {
      if ($body.text().includes("admin@rentcheck.com")) {
        cy.contains("admin@rentcheck.com").should("not.exist");
      }
    });

    cy.contains("Todos los roles").click();
    cy.contains("admin@rentcheck.com").should("be.visible");
  });

  it("should allow suspending and activating a user", () => {
    cy.intercept("GET", "**/api/v1/users*").as("getUsers");
    cy.intercept("PUT", "**/api/v1/users/*").as("updateUser");

    cy.visit("/adm/users");

    cy.wait("@getUsers");

    // Find a non-admin user row to suspend and store their email dynamically
    cy.contains("p", "@gmail.com")
      .first()
      .then(($p) => {
        const email = $p.text().trim();
        cy.wrap(email).as("targetEmail");

        // Click "Suspender" in that exact row
        cy.wrap($p)
          .parents("tr")
          .contains("Suspender")
          .click({ force: true });
      });

    // Confirm SweetAlert
    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("¿Suspender usuario?").should("be.visible");
    cy.contains("Sí, suspender").click();

    // Wait for update call
    cy.wait("@updateUser").its("response.statusCode").should("eq", 200);

    // Success alert should show up
    cy.contains("Usuario suspendido").should("be.visible");

    
    // Now activate that exact user back
    cy.get("@targetEmail").then((email) => {
      cy.get('input[placeholder="Buscar por nombre o email..."]').clear().type(String(email));
      cy.contains("p", String(email))
        .parents("tr")
        .contains("Activar")
        .click({ force: true });
    });

    cy.contains("¿Activar usuario?").should("be.visible");
    cy.contains("Sí, activar").click();

    cy.wait("@updateUser").its("response.statusCode").should("eq", 200);
    cy.contains("Usuario activado").should("be.visible");
  });
});
