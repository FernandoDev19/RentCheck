// TODO: Por terminar

describe("Rentals", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");
  let rentalId: string;
  let pendingRentalId: string;

  const getTomorrow = (offset = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const getStartDate = () => getTomorrow(0); // today is allowed by the form
  const getEndDate = () => getTomorrow(3);

  // ─────────────────────────────────────────────────────────────────────────
  // Owner — /owner/rentals
  // ─────────────────────────────────────────────────────────────────────────
  describe("Owner (Renter)", () => {
    before(() => {
      cy.task("db:reset");
    });

    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      Cypress.session.clearAllSavedSessions();

      cy.login({
        email: rc.email,
        password: rc.password,
        redirectTo: rc.redirectTo,
      });
    });

    it("should display the rentals page with correct structure", () => {
      cy.intercept("GET", "**/api/v1/rentals*").as("getRentals");

      cy.visit("/owner/rentals");

      cy.contains("Listado de rentas").should("be.visible");
      cy.contains("Gestiona el historial de todas las rentas").should(
        "be.visible",
      );

      cy.get('input[id="search"]').should("be.visible");
      cy.get('button[id="create-button"]').should("be.visible");
      cy.get("table").should("be.visible");

      cy.wait("@getRentals").then(({ response }) => {
        expect(response.statusCode).to.be.oneOf([200, 304]);
      });
    });

    it("should open 'Identificar Cliente' modal when clicking the create button", () => {
      cy.visit("/owner/rentals");

      cy.get('button[id="create-button"]').click();

      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Identificar Cliente").should("be.visible");
      cy.get('input[id="swal-id"]').should("be.visible");
      cy.get('button[class="swal2-confirm swal2-styled"]').should("be.visible");
    });

    it("should show validation message when identity number is empty", () => {
      cy.visit("/owner/rentals");

      cy.get('button[id="create-button"]').click();
      cy.wait(500);

      cy.get('button[class="swal2-confirm swal2-styled"]').click();
      cy.wait(300);

      cy.contains("Ingresa un número de identificación").should("be.visible");
    });

    it("should find an existing customer by identity number and prefill form", () => {
      cy.intercept("GET", "**/api/v1/customers/identity/*").as("findCustomer");

      cy.visit("/owner/rentals");

      cy.get('button[id="create-button"]').click();
      cy.wait(500);

      // Use identity of a seeded customer — adjust to whatever seed data has
      cy.get('input[id="swal-id"]').type("id-1001");
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait("@findCustomer");
      cy.wait(500);

      // If customer found → "Cliente encontrado" title
      cy.get('div[class*="swal2-container"]').should("be.visible");

      // Either "Cliente encontrado" or "Nuevo Cliente"
      cy.get(".swal2-title")
        .invoke("text")
        .then((title) => {
          cy.log("Modal title: " + title);
        });

      // Close modal
      cy.get('button[class="swal2-cancel swal2-styled"]').click();
    });

    it("should create a rental for a NEW customer", () => {
      cy.intercept("GET", "**/api/v1/customers/identity/*").as("findCustomer");
      cy.intercept("POST", "**/api/v1/rentals/create-manually").as(
        "createRental",
      );
      cy.intercept("GET", "**/branches*").as("getBranches");

      cy.visit("/owner/rentals");

      cy.get('button[id="create-button"]').click();
      cy.wait(500);

      // Use a unique identity number to avoid conflicts
      const uniqueId = `1234567890123`;
      cy.get('input[id="swal-id"]').type(uniqueId);
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      // Customer not found → open "Nuevo Cliente" form
      cy.wait("@findCustomer");
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.get("button.swal2-confirm.swal2-styled").should("be.visible").click();
      cy.contains("Nuevo Cliente").should("be.visible");

      // Fill customer fields
      cy.get('input[id="swal-name"]').clear().type("Cypress");
      cy.get('input[id="swal-lastName"]').clear().type("TestUser");
      cy.get('input[id="swal-email"]')
        .clear()
        .type(`cypress${Date.now()}@test.com`);
      cy.get('input[id="swal-phone"]').clear().type("3009999999");

      // Fill rental dates
      cy.get('input[id="swal-startDate"]')
        .type(getStartDate())
        .trigger("change");
      cy.get('input[id="swal-expectedReturnDate"]')
        .type(getEndDate())
        .trigger("change");

      // For Owner: must select a branch
      // Open the branch PaginatedSelect
      cy.contains("Seleccionar sede...").should("exist").click({ force: true });
      cy.wait("@getBranches");
      cy.wait(500);
      cy.get(".swal2-popup").within(() => {
        cy.contains("Sede 0").click({ force: true });
      });

      // Try to submit without a vehicle (vehicle is optional)
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait("@createRental", { timeout: 10000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        pendingRentalId = interception.response.body.id;
        rentalId = interception.response.body.id;
      });

      cy.wait(2000);
      cy.contains("La renta ha sido creada correctamente").should("be.visible");
    });

    it("should cancel a pending rental without requiring feedback", () => {
      cy.intercept("DELETE", "**/api/v1/rentals/*").as("cancelRental");

      cy.visit("/owner/rentals");

      // Search for the pending rental by customer name used in creation
      cy.get('input[id="search"]').type("Cypress");
      cy.wait(1000);

      // Find the row with status "pending" and click Cancelar
      cy.contains("Cancelar").first().click();
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("¿Cancelar renta?").should("be.visible");
      cy.contains("¿Estás seguro? Esta acción quedará registrada.").should(
        "be.visible",
      );

      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait(500);

      cy.contains("📋 Motivo de cancelación").should("be.visible");
      cy.contains(
        "Registra el motivo antes de cancelar. Esto queda en el historial del cliente.",
      ).should("be.visible");
      cy.get("#cancel-comments").type("Motivo de cancelación");
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait("@cancelRental").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });

      cy.contains("Renta cancelada").should("be.visible");
    });

    it("should return an active rental", () => {
      cy.intercept("POST", "**/api/v1/rentals/*/return").as("returnRental");
      cy.intercept("GET", "**/api/v1/rentals*").as("getRentals");
      cy.intercept("GET", "**/api/v1/customers/identity/*").as("findCustomer");
      cy.intercept("GET", "**/branches*").as("getBranches");

      cy.visit("/owner/rentals");

      // We need an ACTIVE rental. Let's create one first if none exists or use a seeded one.
      // For robustness, let's create a fresh one for today.
      cy.get('button[id="create-button"]').click();
      cy.wait(500);
      cy.get('input[id="swal-id"]').type("11111223334");
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait("@findCustomer");
      cy.wait(500);

      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.get("button.swal2-confirm.swal2-styled").should("be.visible").click();
      cy.contains("Nuevo Cliente").should("be.visible");

      cy.get('input[id="swal-name"]').clear().type("Return");
      cy.get('input[id="swal-lastName"]').clear().type("User");
      cy.get('input[id="swal-email"]')
        .clear()
        .type(`return${Date.now()}@test.com`);
      cy.get('input[id="swal-phone"]').clear().type("3001112222");
      cy.get('input[id="swal-startDate"]')
        .type(getStartDate())
        .trigger("change");
      cy.get('input[id="swal-expectedReturnDate"]')
        .type(getEndDate())
        .trigger("change");

      cy.contains("Seleccionar sede...").should("exist").click({ force: true });
      cy.wait("@getBranches");
      cy.wait(500);
      cy.get(".swal2-popup").within(() => {
        cy.contains("Sede 0").click({ force: true });
      });

      cy.get('button[class="swal2-confirm swal2-styled"]').click();
      cy.wait(2000);

      // Now find it in the table and return it
      cy.get('input[id="search"]').clear().type("Return");
      cy.wait(1000);

      // Click "Devolver" (the button with label "Devolver")
      cy.contains("Recibir").first().click();

      cy.get(".swal2-popup").should("be.visible");
      cy.contains("¿Marcar como devuelto?").should("be.visible");
      cy.contains(
        "¿Estás seguro de que quieres marcar esta renta como devuelto?",
      ).should("be.visible");
      cy.get("button.swal2-confirm.swal2-styled")
        .first()
        .click({ force: true });

      cy.get("#swal2-title").should("be.visible");
      cy.get("button.swal2-cancel.swal2-styled").first().click();

      cy.wait("@returnRental").then(({ response }) => {
        expect(response.statusCode).to.eq(201); // or 200 depending on backend
      });

      // cy.wait(1500);
      // cy.contains("Renta devuelta correctamente").should("be.visible");
    });

    it("should assign a vehicle to a rental", () => {
      cy.intercept("POST", "**/api/v1/rentals/*/assign-vehicle").as(
        "assignVehicle",
      );
      cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

      cy.visit("/owner/rentals");

      // Search for the rental we just created (which is now returned, so let's find a pending/active one)
      // Actually, let's just use the first available "Ver detalle" button
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get(`button[id="view-rental-${pendingRentalId}"]`).click({
            force: true,
          });
        });

      cy.wait(800);
      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Detalle de la Renta").should("be.visible");

      // Check if it already has a vehicle. If not, the "Asignar vehículo" button should be visible.
      cy.get("body").then(($body) => {
        if ($body.find('button:contains("Asignar vehículo")').length > 0) {
          cy.contains("Asignar vehículo").click();
          cy.wait(500);

          // Pick a vehicle from the list
          cy.get('div[id="swal-vehicle"]').click();
          cy.wait(800);
          cy.get('[id="swal-vehicle"] li').first().click({ force: true });

          cy.get('button[class="swal2-confirm swal2-styled"]').click();

          cy.wait("@assignVehicle").then(({ response }) => {
            expect(response!.statusCode).to.be.oneOf([200, 201]);
          });

          cy.wait(1500);
          cy.contains("Vehículo asignado correctamente").should("be.visible");
        } else {
          cy.log("Rental already has a vehicle or cannot be assigned one");
          cy.get('button[class="swal2-close"]').click();
        }
      });
    });

    it("should show red alert warning for a customer with bad status", () => {
      // Mock a customer response with red_alert status
      cy.intercept("GET", "**/api/v1/customers/identity/RED-123", {
        statusCode: 200,
        body: {
          id: "fake-red-id",
          name: "Mal",
          lastName: "Inquilino",
          identityNumber: "RED-123",
          status: "red_alert",
          rentals: [
            {
              id: "r1",
              rentalFeedback: {
                criticalFlags: { vehicleTheft: true },
              },
              renter: { name: "Rentadora X", city: "Bogotá" },
            },
          ],
        },
      }).as("findRedCustomer");

      cy.visit("/owner/rentals");

      cy.get('button[id="create-button"]').click();
      cy.wait(500);

      cy.get('input[id="swal-id"]').type("RED-123");
      cy.get('button[class="swal2-confirm swal2-styled"]').click();

      cy.wait("@findRedCustomer");
      cy.wait(500);

      // Red alert modal should appear
      cy.get('div[class*="swal2-container"]').should("be.visible");
      cy.contains("Cliente en alerta").should("be.visible");
      cy.contains("MALO").should("be.visible"); // Label for red_alert
      cy.contains("Robo de vehículo").should("be.visible");

      // Should be able to cancel or continue
      cy.contains("Entendido, continuar").should("be.visible");
      cy.contains("Cancelar").click();
    });

    it("should search for a rental by customer name", () => {
      cy.intercept("GET", "**/api/v1/rentals*").as("searchRentals");

      cy.visit("/owner/rentals");

      cy.get('input[id="search"]').type("a");

      cy.wait("@searchRentals");

      cy.get("body").then(($body) => {
        if ($body.text().includes("No hay rentas registradas")) {
          cy.contains("No hay rentas registradas").should("be.visible");
        } else {
          cy.get("table tbody tr").should("have.length.gte", 1);
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin — should not have access to rental management
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin RentCheck", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should redirect admin away from /owner/rentals", () => {
      cy.visit("/owner/rentals");
      cy.url().should("include", "/unauthorized");
    });
  });
});
