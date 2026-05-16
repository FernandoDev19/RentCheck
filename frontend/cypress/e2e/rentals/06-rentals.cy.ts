describe("Rentals", () => {
    const rc = Cypress.env("RENTER_CREDENTIALS");
    let rentalId: string;
    let pendingRentalId: string;

    const getLocalDate = (offset = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        // en-CA format returns YYYY-MM-DD in local time
        return new Intl.DateTimeFormat("en-CA").format(d);
    };

    const getStartDate = () => getLocalDate(0);
    const getEndDate = () => getLocalDate(3);

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

        // it("should display the rentals page with correct structure", () => {
        //     cy.intercept("GET", "**/api/v1/rentals*").as("getRentals");

        //     cy.visit("/owner/rentals");

        //     cy.contains("Listado de rentas").should("be.visible");
        //     cy.contains("Gestiona el historial de todas las rentas").should(
        //         "be.visible",
        //     );

        //     cy.get('input[id="search"]').should("be.visible");
        //     cy.get('button[id="create-button"]').should("be.visible");
        //     cy.get("table").should("be.visible");

        //     cy.wait("@getRentals").then(({ response }) => {
        //         expect(response.statusCode).to.be.oneOf([200, 304]);
        //     });
        // });

        // it("should open 'Identificar Cliente' modal when clicking the create button", () => {
        //     cy.visit("/owner/rentals");

        //     cy.get('button[id="create-button"]').click();

        //     cy.wait(500);

        //     cy.get('div[class*="swal2-container"]').should("be.visible");
        //     cy.contains("Identificar Cliente").should("be.visible");
        //     cy.get('input[id="swal-id"]').should("be.visible");
        //     cy.get('button[class="swal2-confirm swal2-styled"]').should(
        //         "be.visible",
        //     );
        // });

        // it("should show validation message when identity number is empty", () => {
        //     cy.visit("/owner/rentals");

        //     cy.get('button[id="create-button"]').click();
        //     cy.wait(500);

        //     cy.get('button[class="swal2-confirm swal2-styled"]').click();
        //     cy.wait(300);

        //     cy.contains("Ingresa un número de identificación").should(
        //         "be.visible",
        //     );
        // });

        // it("should find an existing customer by identity number and prefill form", () => {
        //     cy.intercept("GET", "**/api/v1/customers/identity/*").as(
        //         "findCustomer",
        //     );

        //     cy.visit("/owner/rentals");

        //     cy.get('button[id="create-button"]').click();
        //     cy.wait(500);

        //     // Use identity of a seeded customer — adjust to whatever seed data has
        //     cy.get('input[id="swal-id"]').type("id-1001");
        //     cy.get('button[class="swal2-confirm swal2-styled"]').click();

        //     cy.wait("@findCustomer");
        //     cy.wait(500);

        //     // If customer found → "Cliente encontrado" title
        //     cy.get('div[class*="swal2-container"]').should("be.visible");

        //     // Either "Cliente encontrado" or "Nuevo Cliente"
        //     cy.get(".swal2-title")
        //         .invoke("text")
        //         .then((title) => {
        //             cy.log("Modal title: " + title);
        //         });

        //     // Close modal
        //     cy.get('button[class="swal2-cancel swal2-styled"]').click();
        // });

        it("should create a rental for a NEW customer", () => {
            cy.intercept("GET", "**/api/v1/customers/identity/*").as(
                "findCustomer",
            );
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
            cy.get("button.swal2-confirm.swal2-styled")
                .should("be.visible")
                .click();
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
            cy.contains("Seleccionar sede...")
                .should("exist")
                .click({ force: true });
            cy.wait("@getBranches");
            cy.wait(1500);
            cy.get(".max-h-52 > :nth-child(1)").click({ force: true });

            // Try to submit without a vehicle (vehicle is optional)
            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@createRental", { timeout: 10000 }).then(
                (interception) => {
                    expect(interception.response.statusCode).to.be.oneOf([
                        200, 201,
                    ]);
                    pendingRentalId = interception.response.body.id;
                    rentalId = interception.response.body.id;
                },
            );

            cy.wait(500);
            cy.contains("La renta ha sido creada correctamente").should(
                "be.visible",
            );
        });

        it("should assign a vehicle to a rental", () => {
            // 1. Create a vehicle in Sede 0 first
            cy.intercept("POST", "**/api/v1/vehicles").as("createVehicle");
            cy.intercept("GET", "**/branches*").as("getBranches");

            cy.visit("/owner/vehicles");
            cy.get('button[id="create-button"]').click();
            cy.wait(500);

            const testPlate = `CYP${Date.now().toString().slice(-4)}`;

            cy.get('input[id="v-plate"]').type(testPlate);
            cy.get('input[id="v-brand"]').type("Toyota");
            cy.get('input[id="v-model"]').type("Corolla");
            cy.get('input[id="v-year"]').clear().type("2022");
            cy.get('input[id="v-color"]').type("Blanco");
            cy.get('select[id="v-transmission"]').select("manual");
            cy.get('input[id="v-rentalPriceByDay"]').clear().type("150000");

            cy.contains("Seleccionar sede...")
                .should("exist")
                .click({ force: true });
            cy.wait("@getBranches");
            cy.wait(1500);
            cy.get(".max-h-52 > :nth-child(1)").click({ force: true });

            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait("@createVehicle").then((interception) => {
                expect(interception.response!.statusCode).to.be.oneOf([
                    200, 201,
                ]);
            });
            cy.wait(1500);

            // 2. Assign it to the rental
            cy.intercept("POST", "**/api/v1/rentals/*/assign-vehicle").as(
                "assignVehicle",
            );
            cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

            cy.visit("/owner/rentals");

            // Actually, let's just use the first available "Asignar Vehículo" button
            // If the pending rental has ID pendingRentalId
            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.get(`button[id="view-rental-${pendingRentalId}"]`).click(
                        {
                            force: true,
                        },
                    );
                });

            cy.wait(800);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.get("#swal2-title").should("include.text", "Detalle de Renta");
            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.get(
                        `button[id="assign-vehicle-${pendingRentalId}"]`,
                    ).click({
                        force: true,
                    });
                });

            cy.contains("Seleccionar vehículo disponible...")
                .should("exist")
                .click({ force: true });
            cy.wait(800);

            cy.contains(`${testPlate} — Toyota Corolla`).click({ force: true });

            cy.get(".gap-3 > .bg-indigo-600").click();

            cy.wait("@assignVehicle").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 201]);
            });
        });

        it("should cancel a pending rental without requiring feedback", () => {
            cy.intercept("GET", "**/api/v1/customers/identity/*").as(
                "findCustomer",
            );
            cy.intercept("GET", "**/branches*").as("getBranches");
            cy.intercept("POST", "**/api/v1/rentals/create-manually").as(
                "createRental",
            );
            cy.intercept("DELETE", "**/api/v1/rentals/*").as("cancelRental");

            cy.visit("/owner/rentals");

            // 1. Create a fresh PENDING rental (no vehicle)
            cy.get('button[id="create-button"]').click();
            cy.wait(500);
            const cancelPendingId = `999${Date.now().toString().slice(-8)}`;
            cy.get('input[id="swal-id"]').type(cancelPendingId);
            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait("@findCustomer");
            cy.wait(500);
            cy.get("button.swal2-confirm.swal2-styled").click();

            cy.get('input[id="swal-name"]').clear().type("Cancel");
            cy.get('input[id="swal-lastName"]').clear().type("Pending");
            cy.get('input[id="swal-email"]')
                .clear()
                .type(`cancel${Date.now()}@test.com`);
            cy.get('input[id="swal-phone"]').clear().type("3000000000");

            cy.get('input[id="swal-startDate"]')
                .type(getLocalDate(1))
                .trigger("change");
            cy.get('input[id="swal-expectedReturnDate"]')
                .type(getEndDate())
                .trigger("change");

            cy.contains("Seleccionar sede...")
                .should("exist")
                .click({ force: true });
            cy.wait("@getBranches");
            cy.wait(1500);
            cy.get(".max-h-52 > :nth-child(1)").click({ force: true });

            // Submit without vehicle -> becomes PENDING
            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait("@createRental");
            cy.wait(1000);

            // 2. Search and Cancel
            cy.get('input[id="search"]').clear().type("Cancel");
            cy.wait(1000);

            // Find the row and click Cancelar
            cy.contains("Cancelar").first().click();
            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("¿Eliminar renta?").should("be.visible");
            cy.contains(
                "Esta renta aún no ha iniciado. Se eliminará sin afectar el historial del cliente.",
            ).should("be.visible");

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@cancelRental").then(({ response }) => {
                expect(response!.statusCode).to.eq(200);
            });

            cy.contains("Renta eliminada").should("be.visible");
        });

        it("should return an active rental", () => {
            cy.intercept("POST", "**/api/v1/rentals/*/return").as(
                "returnRental",
            );
            cy.intercept("GET", "**/api/v1/rentals*").as("getRentals");
            cy.intercept("GET", "**/api/v1/customers/identity/*").as(
                "findCustomer",
            );
            cy.intercept("GET", "**/api/v1/vehicles/available*").as(
                "getAvailableVehicles",
            );
            cy.intercept("GET", "**/branches*").as("getBranches");

            // 1. Create a vehicle first to ensure we can make the rental ACTIVE
            cy.visit("/owner/vehicles");
            cy.get('button[id="create-button"]').click();
            const activePlate = `ACT${Date.now().toString().slice(-4)}`;
            cy.get('input[id="v-plate"]').type(activePlate);
            cy.get('input[id="v-brand"]').type("Ford");
            cy.get('input[id="v-model"]').type("Fiesta");
            cy.get('input[id="v-year"]').clear().type("2021");
            cy.get('input[id="v-color"]').type("Azul");
            cy.get('select[id="v-transmission"]').select("manual");
            cy.get('input[id="v-rentalPriceByDay"]').clear().type("120000");

            cy.contains("Seleccionar sede...")
                .should("exist")
                .click({ force: true });
            cy.wait("@getBranches");
            cy.get(".swal2-popup").within(() => {
                cy.contains("Sede 0").click({ force: true });
            });
            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait(1500);

            // 2. Create an ACTIVE rental (by selecting the vehicle)
            cy.visit("/owner/rentals");
            cy.get('button[id="create-button"]').click();
            cy.wait(500);
            const returnActiveId = `888${Date.now().toString().slice(-8)}`;
            cy.get('input[id="swal-id"]').type(returnActiveId);
            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait("@findCustomer");
            cy.wait(500);
            cy.get("button.swal2-confirm.swal2-styled").click();

            cy.get('input[id="swal-name"]').clear().type("Return");
            cy.get('input[id="swal-lastName"]').clear().type("Active");
            cy.get('input[id="swal-email"]')
                .clear()
                .type(`active${Date.now()}@test.com`);
            cy.get('input[id="swal-phone"]').clear().type("3110000000");

            cy.get('input[id="swal-startDate"]')
                .type(getLocalDate())
                .trigger("change");
            cy.get('input[id="swal-expectedReturnDate"]')
                .type(getEndDate())
                .trigger("change");

            cy.contains("Seleccionar sede...")
                .should("exist")
                .click({ force: true });
            cy.wait("@getBranches");
            cy.wait(1500);
            cy.get(".max-h-52 > :nth-child(1)").click({ force: true });

            // Select the vehicle to make it ACTIVE
            cy.contains("Seleccionar vehículo (opcional)...").click({
                force: true,
            });
            cy.wait("@getAvailableVehicles");
            cy.contains(activePlate).click({ force: true });

            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait(2000);

            // 3. Search and Return
            cy.get('input[id="search"]').clear().type("Return");
            cy.wait(2000);

            // Click "Recibir"
            cy.get("table").should("include.text", "Return");
            cy.contains("Recibir").first().click();

            cy.get(".swal2-popup").should("be.visible");
            cy.contains("¿Marcar como devuelto?").should("be.visible");
            cy.get("button.swal2-confirm.swal2-styled")
                .first()
                .click({ force: true });

            // Feedback modal should appear
            cy.contains("Feedback — Return Active").should("be.visible");
            // Omit feedback for now
            cy.get("button.swal2-cancel.swal2-styled").first().click();

            cy.wait("@returnRental").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 201]);
            });
        });

        // it("should show red alert warning for a customer with bad status", () => {
        //     // Mock a customer response with red_alert status
        //     cy.intercept("GET", "**/api/v1/customers/identity/RED-123", {
        //         statusCode: 200,
        //         body: {
        //             id: "fake-red-id",
        //             name: "Mal",
        //             lastName: "Inquilino",
        //             identityNumber: "RED-123",
        //             status: "red_alert",
        //             rentals: [
        //                 {
        //                     id: "r1",
        //                     rentalFeedback: {
        //                         criticalFlags: { vehicleTheft: true },
        //                     },
        //                     renter: { name: "Rentadora X", city: "Bogotá" },
        //                 },
        //             ],
        //         },
        //     }).as("findRedCustomer");

        //     cy.visit("/owner/rentals");

        //     cy.get('button[id="create-button"]').click();
        //     cy.wait(500);

        //     cy.get('input[id="swal-id"]').type("RED-123");
        //     cy.get('button[class="swal2-confirm swal2-styled"]').click();

        //     cy.wait("@findRedCustomer");
        //     cy.wait(500);

        //     // Red alert modal should appear
        //     cy.get('div[class*="swal2-container"]').should("be.visible");
        //     cy.contains("Cliente en alerta").should("be.visible");
        //     cy.contains("Alerta roja").should("be.visible"); // Label for red_alert
        //     cy.contains("Robo de vehículo").should("be.visible");

        //     // Should be able to cancel or continue
        //     cy.contains("Entendido, continuar").should("be.visible");
        //     cy.get(".swal2-cancel").click({ force: true });
        // });

        // it("should search for a rental by customer name", () => {
        //     cy.intercept("GET", "**/api/v1/rentals*").as("searchRentals");

        //     cy.visit("/owner/rentals");

        //     cy.get('input[id="search"]').type("a");

        //     cy.wait("@searchRentals");

        //     cy.get("body").then(($body) => {
        //         if ($body.text().includes("No hay rentas registradas")) {
        //             cy.contains("No hay rentas registradas").should(
        //                 "be.visible",
        //             );
        //         } else {
        //             cy.get("table tbody tr").should("have.length.gte", 1);
        //         }
        //     });
        // });

        // it("should request a biometry for a customer", () => {
        //     cy.intercept("POST", "**/api/v1/biometry-requests/request").as(
        //         "requestBiometry",
        //     );
        //     cy.intercept("GET", "**/api/v1/rentals*").as("getRentals");

        //     cy.visit("/owner/rentals");
        //     cy.wait("@getRentals");

        //     // Toma algún cliente de alguna renta que diga "Sin verificar" y haz click
        //     cy.contains("Sin verificar").first().click({ force: true });

        //     cy.wait(500);
        //     cy.get('div[class*="swal2-container"]').should("be.visible");
        //     cy.contains("Verificación biométrica").should("be.visible");

        //     cy.contains("button", "Solicitar nueva biometría").click();

        //     cy.wait("@requestBiometry").then(({ response }) => {
        //         expect(response!.statusCode).to.be.oneOf([200, 201]);
        //     });

        //     cy.wait(500);
        //     cy.contains("Solicitud enviada").should("be.visible");
        // });
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
