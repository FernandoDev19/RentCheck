import { formatDate } from "../../helpers/format-date";

type RenterFixture = {
  name: string;
  nit: string;
  address?: string;
  city?: string;
  email: string;
  phone: string;
  password: string;
  legalRepresentative?: string;
  planId: number;
  planExpiresAt: string;
  balance: number;
  lowBalanceThreshold: number;
  lowBalanceAlertEnabled: boolean;
  status: string;
};

describe("Renters", () => {
  let renter: RenterFixture;
  let createdId: string;
  const apiUrl = `${Cypress.env("apiUrl")}/renters`;

  before(() => {
    cy.task("db:reset");
    cy.fixture("renter").then((data) => {
      renter = data;
    });
  });

  beforeEach(() => {
    cy.login();
  });

  describe("Admin Rentcheck", () => {
    it("should display the renters page", () => {
      cy.visit("/adm/renters");

      cy.contains("Gestión de Rentadoras").should("be.visible");

      cy.get('button[id="create-button"]').should("be.visible");
      cy.get('input[id="search"]').should("be.visible");
      cy.get("table").should("be.visible");
    });

    it("should render errors", () => {
      cy.visit("/adm/renters");

      cy.get('button[id="create-button"]').click();

      // Wait for SweetAlert to appear
      cy.wait(500);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("be.visible");
      cy.contains("Crear nueva rentadora").should("be.visible");

      // Try to submit without filling any fields
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      // Wait for validation errors
      cy.wait(500);

      // Check for validation error messages
      cy.contains("Too small: expected string to have >=1 characters")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Invalid email address")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Too small: expected string to have >=7 characters")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Too small: expected string to have >=8 characters")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Too small: expected string to have >=3 characters")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Too small: expected number to be >=1")
        .scrollIntoView()
        .should("be.visible");
      cy.contains("Revisa los campos marcados en rojo")
        .scrollIntoView()
        .should("be.visible");
    });

    it("should create a new renter", () => {
      cy.intercept("POST", apiUrl).as("createRenter");

      cy.visit("/adm/renters");

      cy.get('button[id="create-button"]').click();

      // Wait for SweetAlert to appear
      cy.wait(500);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("be.visible");
      cy.contains("Crear nueva rentadora").should("be.visible");

      // Scroll to make sure all fields are visible
      cy.get('input[id="swal-name"]').should("be.visible");
      cy.get('input[id="swal-nit"]').should("be.visible");
      cy.get('input[id="swal-email"]').should("be.visible");
      cy.get('input[id="swal-phone"]').should("be.visible");
      cy.get('input[id="swal-password"]').should("be.visible");
      cy.get('input[id="swal-legal-representative"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('select[id="swal-plan"]').should("be.visible");
      cy.get('input[id="swal-expiration-date"]').should("be.visible");
      cy.get('input[id="swal-balance"]').should("be.visible");
      cy.get('input[id="swal-balance-threshold"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('input[id="swal-low-balance-alert"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('select[id="swal-status"]').scrollIntoView().should("be.visible");

      cy.get('button[class="swal2-confirm swal2-styled"]').should("be.visible");

      // Fill form
      cy.get('input[id="swal-name"]').type(renter.name);
      cy.get('input[id="swal-nit"]').type(renter.nit);
      cy.get('input[id="swal-email"]').type(renter.email);
      cy.get('input[id="swal-phone"]').type(renter.phone);
      cy.get('input[id="swal-password"]').type(renter.password);
      cy.get('input[id="swal-legal-representative"]').type(
        renter.legalRepresentative || "",
      );
      cy.get('select[id="swal-plan"]').select(renter.planId.toString());
      cy.get('input[id="swal-expiration-date"]').type(renter.planExpiresAt);
      cy.get('input[id="swal-balance"]').type(renter.balance.toString());
      cy.get('input[id="swal-balance-threshold"]').type(
        renter.lowBalanceThreshold.toString(),
      );
      cy.get('input[id="swal-low-balance-alert"]').check();
      cy.get('select[id="swal-status"]').select(renter.status);

      // Click submit button
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      // Wait for success message
      cy.wait(1000);

      cy.contains("La rentadora ha sido creada correctamente").should(
        "be.visible",
      );

      cy.wait("@createRenter").then((interception) => {
        createdId = interception.response.body.id;
        expect(interception.response.statusCode).to.eq(201);
        expect(createdId).to.be.a("string");
      });
    });

    it("should get renter with search input", () => {
      cy.visit("/adm/renters");

      cy.get('input[id="search"]').type(renter.name);

      cy.wait(1000);

      cy.contains(renter.name).should("be.visible");
    });

    it("should display the renter details when clicking the view button", () => {
      cy.visit("/adm/renters");

      cy.get(`[id="view-renter-${createdId}"]`).click();

      cy.url().should("include", `/adm/renters`);

      cy.wait(1000);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("be.visible");
      cy.contains("Ver rentadora").should("be.visible");
      cy.get('button[class="swal2-close"]').should("be.visible");

      // Verify renter details are displayed
      cy.contains(renter.name).should("be.visible");
      cy.contains(renter.nit).should("be.visible");
      cy.contains(renter.email).should("be.visible");
      cy.contains(renter.phone).should("be.visible");
      cy.contains(renter.legalRepresentative || "").should("be.visible");
      cy.contains(renter.planId.toString()).should("be.visible");
      cy.contains(formatDate(renter.planExpiresAt)).should("be.visible");
      cy.contains("$" + renter.balance.toLocaleString("es-CO")).should(
        "be.visible",
      );
      cy.contains(
        "$" + renter.lowBalanceThreshold.toLocaleString("es-CO"),
      ).should("be.visible");
      cy.contains("Activa").should("be.visible");
      cy.contains("Activo").should("be.visible");
    });

    it("should display the renter edit form when clicking the edit button", () => {
      cy.visit("/adm/renters");

      cy.get(`[id="edit-renter-${createdId}"]`).click();

      cy.url().should("include", `/adm/renters`);

      cy.wait(1000);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("be.visible");
      cy.contains("Editar rentadora").should("be.visible");

      // Verify renter details are displayed
      cy.get('input[id="swal-name"]').should("be.visible");
      cy.get('input[id="swal-nit"]').should("be.visible");
      cy.get('input[id="swal-email"]').should("be.visible");
      cy.get('input[id="swal-phone"]').should("be.visible");
      cy.get('input[id="swal-legal-representative"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('select[id="swal-plan"]').scrollIntoView().should("be.visible");
      cy.get('input[id="swal-expiration-date"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('input[id="swal-balance"]').scrollIntoView().should("be.visible");
      cy.get('input[id="swal-balance-threshold"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('input[id="swal-low-balance-alert"]')
        .scrollIntoView()
        .should("be.visible");
      cy.get('select[id="swal-status"]').scrollIntoView().should("be.visible");

      // Edit fields
      cy.get('input[id="swal-name"]')
        .clear()
        .type("edit " + renter.name);
      cy.get('input[id="swal-nit"]')
        .clear()
        .type("1" + renter.nit);
      cy.get('input[id="swal-email"]')
        .clear()
        .type("edit-" + renter.email);
      cy.get('input[id="swal-phone"]')
        .clear()
        .type(renter.phone + "0");
      cy.get('input[id="swal-legal-representative"]')
        .clear()
        .type((renter.legalRepresentative || "") + "-edit");
      cy.get('select[id="swal-plan"]').select(2);
      cy.get('input[id="swal-expiration-date"]')
        .clear()
        .type(renter.planExpiresAt);
      cy.get('input[id="swal-balance"]')
        .clear()
        .type((renter.balance + 100).toString());
      cy.get('input[id="swal-balance-threshold"]')
        .clear()
        .type((renter.lowBalanceThreshold + 50).toString());
      cy.get('input[id="swal-low-balance-alert"]').check();
      cy.get('select[id="swal-status"]').select(renter.status);

      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait(1000);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("not.exist");
    });

    it("should suspend a renter", () => {
      cy.visit("/adm/renters");

      cy.get(`[id="delete-renter-${createdId}"]`)
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.url().should("include", `/adm/renters`);

      cy.wait(1000);

      cy.get(
        'div[class="swal2-container swal2-center swal2-backdrop-show"]',
      ).should("be.visible");
      cy.contains("¿Eliminar Rentadora?").should("be.visible");
      cy.contains(
        "¿Estás seguro de que quieres eliminar a esta rentadora?",
      ).should("be.visible");
      cy.get('button[class="swal2-confirm swal2-styled"]').should("be.visible");
      cy.get('button[class="swal2-cancel swal2-styled"]').should("be.visible");

      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait(1000);

      cy.contains("Eliminado").should("be.visible");
      cy.contains("Rentadora eliminada correctamente").should("be.visible");

      cy.task("db:reset");
    });
  });
});
