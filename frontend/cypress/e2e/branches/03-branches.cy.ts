type Branch = {
  id: string;
  name: string;
  email: string;
  phone: string;
  responsible: string;
};

describe("Branches", () => {
  let branch: Branch;
  let branchId: string;
  const apiUrl = `${Cypress.env("apiUrl")}/branches*`;

  before(() => {
    cy.task("db:reset");
    Cypress.session.clearAllSavedSessions();
  });

  // describe("Admin Rentcheck", () => {
  //   beforeEach(() => {
  //     cy.login();
  //   });

  //   it("should display the branches page", () => {
  //     cy.intercept("GET", apiUrl, (req) => {
  //       req.headers["cache-control"] = "no-cache";
  //     }).as("getBranches");

  //     cy.visit("/adm/branches");

  //     cy.contains("Gestión de Sedes").should("be.visible");
  //     cy.contains("Administra las sedes de tu empresa").should("be.visible");

  //     cy.get('input[id="search"]').should("be.visible");
  //     cy.get("table").should("be.visible");

  //     cy.wait("@getBranches").then(({ response }) => {
  //       expect(response).to.not.be.undefined;
  //       const body = response!.body;

  //       expect(body).to.have.property("data");

  //       expect(body.data).to.be.an("array");
  //       expect(body.data.length).to.be.greaterThan(0);

  //       // Buscar la primera sede disponible si no encuentra "Sede 1"
  //       const foundBranch = response.body.data[0];
  //       branchId = foundBranch.id;

  //       // Actualizar el objeto branch con los datos reales
  //       branch = foundBranch as Branch;
  //     });
  //   });

  //   it("should get branch with search input", () => {
  //     cy.visit("/adm/branches");

  //     cy.get('input[id="search"]').type(branch.name);

  //     cy.wait(1000);

  //     cy.contains(branch.name).should("be.visible");
  //   });

  //   it("should display the branch details when clicking the view button", () => {
  //     cy.visit("/adm/branches");

  //     cy.get(`[id="view-branch-${branchId}"]`)
  //       .scrollIntoView()
  //       .should("be.visible")
  //       .click();

  //     cy.url().should("include", `/adm/branches`);

  //     cy.wait(1000);

  //     cy.get(
  //       'div[class="swal2-container swal2-center swal2-backdrop-show"]',
  //     ).should("be.visible");
  //     cy.contains("Ver sede").should("be.visible");

  //     // Verify branch details are displayed
  //     cy.contains(branch.name).should("be.visible");
  //     cy.contains(branch.phone).should("be.visible");
  //     cy.contains(branch.responsible).should("be.visible");
  //   });
  // });

  describe("Renter", () => {
    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();

      const rc = Cypress.env("RENTER_CREDENTIALS");

      cy.login({
        email: rc.email,
        password: rc.password,
        redirectTo: rc.redirectTo,
      });
    });

    it("should display the unauthorized message", () => {
      cy.visit("/adm/branches");

      cy.url().should("include", "/unauthorized");
    });

    it("should display the branches page", () => {
      cy.intercept("GET", apiUrl, (req) => {
        req.headers["cache-control"] = "no-cache";
      }).as("getRenterBranches");

      cy.visit("/owner/branches");

      cy.contains("Gestión de Sedes").should("be.visible");
      cy.contains("Administra las sedes de tu empresa").should("be.visible");

      cy.get('input[id="search"]').should("be.visible");
      cy.get('button[id="create-button"]').should("be.visible");
      cy.get("table").should("be.visible");

      cy.wait("@getRenterBranches").then(({ response }) => {
        expect(response).to.not.be.undefined;

        const body = response!.body;

        expect(body).to.have.property("data");

        expect(body.data).to.be.an("array");
        expect(body.data.length).to.be.greaterThan(0);

        const foundBranch = response.body.data[0];
        branchId = foundBranch.id;
        branch = foundBranch as Branch;
      });
    });

    it("should get branch with search input", () => {
      cy.intercept("GET", apiUrl, (req) => {
        req.headers["cache-control"] = "no-cache";
      }).as("getRenterBranches");

      cy.visit("/owner/branches");

      cy.get('input[id="search"]').type(branch.name);

      cy.wait("@getRenterBranches").then(({ response }) => {
        expect(response).to.not.be.undefined;

        const body = response!.body;

        expect(body).to.have.property("data");

        expect(body.data).to.be.an("array");
        expect(body.data.length).to.be.greaterThan(0);
        expect(body.data.some((b: Branch) => b.id === branchId)).to.be.true;
      });

      cy.contains(branch.name).should("be.visible");
    });

    it("should display the branch details when clicking the view button", () => {
      cy.visit("/owner/branches");
      cy.intercept("GET", `${Cypress.env("apiUrl")}/branches/*`).as(
        "getSingleBranch",
      );

      cy.get(`[id="view-branch-${branchId}"]`)
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.wait("@getSingleBranch");

      cy.get(".swal2-container").should("be.visible");
      cy.contains("Ver sede").should("be.visible");

      // Verify branch details are displayed using contains for robustness
      cy.get(".swal2-html-container").within(() => {
        cy.contains(branch.name).should("be.visible");
        if (branch.email) {
          cy.contains(branch.email).should("be.visible");
        }
        cy.contains(branch.phone).should("be.visible");
        cy.contains(branch.responsible).should("be.visible");
      });
    });

    it("should display the edit branch modal when clicking the edit button", () => {
      cy.visit("/owner/branches");
      cy.intercept("GET", `${Cypress.env("apiUrl")}/branches/*`).as(
        "getSingleBranch",
      );

      cy.get(`[id="edit-branch-${branchId}"]`)
        .scrollIntoView()
        .should("be.visible")
        .click();

      cy.wait("@getSingleBranch");

      cy.get(".swal2-container").should("be.visible");

      // Verify branch details are pre-filled
      cy.get("#swal-name").should("have.value", branch.name);
      cy.get("#swal-phone").should("have.value", branch.phone);
      cy.get("#swal-responsible")
        .scrollIntoView()
        .should("have.value", branch.responsible);
      cy.contains("Editar sede").should("be.visible");
    });

    it("should allow edit branch", () => {
      cy.intercept("GET", apiUrl, (req) => {
        req.headers["cache-control"] = "no-cache";
      }).as("getRenterBranches");

      const updatedName = `${branch.name} Editada`;
      cy.visit("/owner/branches");
      cy.intercept("GET", `${Cypress.env("apiUrl")}/branches/*`).as(
        "getSingleBranch",
      );
      cy.intercept("PUT", `${Cypress.env("apiUrl")}/branches/*`).as(
        "updateBranch",
      );

      cy.get(`[id="edit-branch-${branchId}"]`).scrollIntoView().click();

      cy.wait("@getSingleBranch");

      cy.get("#swal-name").clear().type(updatedName);
      cy.get("#swal-phone").clear().type("3001234567");

      cy.get(".swal2-confirm").click();

      cy.wait("@updateBranch");

      cy.contains("La sede ha sido editada correctamente").should("be.visible");

      // Wait for modal to close (animation takes time)
      cy.get(".swal2-container", { timeout: 10000 }).should("not.exist");

      // Verify update in table
      cy.get('input[id="search"]').clear().type(updatedName);
      cy.wait("@getRenterBranches");
      cy.contains(updatedName).should("be.visible");
    });

    it("should allow create branch", () => {
      cy.intercept("GET", apiUrl, (req) => {
        req.headers["cache-control"] = "no-cache";
      }).as("getRenterBranches");

      const newBranchName = "Sede de Prueba Nueva";
      cy.visit("/owner/branches");
      cy.intercept("POST", `${Cypress.env("apiUrl")}/branches`).as(
        "createBranch",
      );

      cy.get('button[id="create-button"]').click();

      cy.get(".swal2-container").should("be.visible");
      cy.contains("Crear nueva Sede").should("be.visible");

      cy.get("#swal-name").type(newBranchName);
      cy.get("#swal-city").type("Barranquilla");
      cy.get("#swal-address").type("Calle 100 # 50-20");
      cy.get("#swal-phone").type("3109876543");
      cy.get("#swal-responsible").type("Juan Perez");
      cy.get("#swal-email").type("sede.test@rentcheck.com");
      cy.get("#swal-password").type("Password123!");
      cy.get("#swal-status").select("true");

      cy.get(".swal2-confirm").click();

      cy.wait("@createBranch");

      cy.contains("La sede ha sido creada correctamente").should("be.visible");
      cy.get(".swal2-container", { timeout: 10000 }).should("not.exist");

      // Verify creation
      cy.get('input[id="search"]').clear().type(newBranchName);
      cy.wait("@getRenterBranches");
      cy.contains(newBranchName).should("be.visible");
    });

    it("should allow delete branch", () => {
      cy.visit("/owner/branches");
      cy.intercept("DELETE", `${Cypress.env("apiUrl")}/branches/*`).as(
        "deleteBranch",
      );

      // We'll delete the original branch we've been using
      cy.get('input[id="search"]').clear().type(branch.name);

      cy.get(`[id="delete-branch-${branchId}"]`).scrollIntoView().click();

      cy.get(".swal2-container").should("be.visible");
      cy.contains("¿Eliminar Sede?").should("be.visible");

      cy.get(".swal2-confirm").click();

      cy.wait("@deleteBranch");

      cy.contains("Sede eliminada correctamente").should("be.visible");
      cy.get(".swal2-container", { timeout: 10000 }).should("not.exist");

      cy.wait(1000);
      cy.contains("No hay sedes registradas").should("be.visible");
    });
  });
});
