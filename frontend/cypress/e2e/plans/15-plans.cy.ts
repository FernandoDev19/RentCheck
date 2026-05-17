describe("Plans", () => {
  before(() => {
    cy.task("db:reset");
    Cypress.session.clearAllSavedSessions();
  });

  beforeEach(() => {
    cy.login(); // Logs in as ADMIN
  });

  it("should display the plans page with correct structure", () => {
    cy.intercept("GET", "**/api/v1/plans*").as("getPlans");

    cy.visit("/adm/plans");

    cy.contains("Planes de suscripción").should("be.visible");
    cy.contains("Gestiona los planes disponibles para las rentadoras").should("be.visible");
    cy.contains("Nuevo plan").should("be.visible");

    cy.wait("@getPlans").then(({ response }) => {
      expect(response!.statusCode).to.be.oneOf([200, 304]);
    });
  });

  it("should validate and create a new plan", () => {
    cy.intercept("POST", "**/api/v1/plans").as("createPlan");

    cy.visit("/adm/plans");

    cy.contains("Nuevo plan").click();

    // Modal should be visible
    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("Crear nuevo plan").should("be.visible");

    // Try submitting empty name to test validation
    cy.get('button[class*="swal2-confirm"]').click();
    cy.contains("El nombre del plan es obligatorio").should("be.visible");

    // Fill form fields
    cy.get('input[id="p-name"]').type("Plan Premium E2E");
    cy.get('input[id="p-price"]').clear().type("85000");
    cy.get('input[id="p-max-users"]').clear().type("10");
    cy.get('input[id="p-max-branches"]').clear().type("5");
    cy.get('input[id="p-max-vehicles"]').clear().type("30");
    cy.get('input[id="p-reports"]').check();
    cy.get('input[id="p-alerts"]').check();
    cy.get('input[id="p-support"]').check();

    // Submit
    cy.get('button[class*="swal2-confirm"]').click();

    cy.wait("@createPlan").then(({ response }) => {
      expect(response!.statusCode).to.eq(201);
    });

    cy.contains("Plan creado").should("be.visible");
    cy.contains("Plan Premium E2E").should("be.visible");
  });

  it("should view plan details", () => {
    cy.visit("/adm/plans");

    // Find the created plan card and click "Ver detalle"
    cy.contains("Plan Premium E2E")
      .parents(".bg-white")
      .contains("Ver detalle")
      .click();

    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("COP").should("be.visible");
    cy.contains("Reportes avanzados").should("be.visible");

    // Close the detail modal
    cy.get(".swal2-close").click();
  });

  it("should edit a plan", () => {
    cy.intercept("PUT", "**/api/v1/plans/*").as("updatePlan");

    cy.visit("/adm/plans");

    // Find the edit button (first action button with Edit icon on our card)
    cy.contains("Plan Premium E2E")
      .parents(".bg-white")
      .find("button")
      .eq(1) // second button in footer (first is "Ver detalle", second is "Edit", third is "Delete")
      .click();

    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("Editar — Plan Premium E2E").should("be.visible");

    // Modify price and name
    cy.get('input[id="p-name"]').clear().type("Plan Premium E2E Modificado");
    cy.get('input[id="p-price"]').clear().type("99000");

    cy.get('button[class*="swal2-confirm"]').click();

    cy.wait("@updatePlan").then(({ response }) => {
      expect(response!.statusCode).to.be.oneOf([200, 204]);
    });

    cy.contains("Plan actualizado").should("be.visible");
    cy.contains("Plan Premium E2E Modificado").should("be.visible");
  });

  it("should delete a plan", () => {
    cy.intercept("DELETE", "**/api/v1/plans/*").as("deletePlan");

    cy.visit("/adm/plans");

    // Click delete button
    cy.contains("Plan Premium E2E Modificado")
      .parents(".bg-white")
      .find("button")
      .eq(2) // third button in footer
      .click();

    cy.get('div[class*="swal2-container"]').should("be.visible");
    cy.contains("¿Eliminar").should("be.visible");
    cy.contains("Sí, eliminar").click();

    cy.wait("@deletePlan").then(({ response }) => {
      expect(response!.statusCode).to.be.oneOf([200, 204]);
    });

    cy.contains("Eliminado").should("be.visible");
    cy.contains("Plan Premium E2E Modificado").should("not.exist");
  });
});
