type VehicleFixture = {
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    transmission: string;
    rentalPriceByDay: number;
};

describe("Vehicles", () => {
    const rc = Cypress.env("RENTER_CREDENTIALS");
    const ec = Cypress.env("EMPLOYEE_CREDENTIALS");
    let createdVehicleId: string;

    const vehicle: VehicleFixture = {
        plate: `CYP${Date.now().toString().slice(-4)}`,
        brand: "Toyota",
        model: "Corolla",
        year: 2022,
        color: "Blanco",
        transmission: "manual",
        rentalPriceByDay: 150000,
    };

    before(() => {
        cy.task("db:reset");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Owner — /owner/vehicles
    // ─────────────────────────────────────────────────────────────────────────
    describe("Owner (Renter)", () => {
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

        it("should display the vehicles page with correct structure", () => {
            cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

            cy.visit("/owner/vehicles");

            cy.contains("Vehículos").should("be.visible");
            cy.contains("Gestiona el inventario de vehículos").should(
                "be.visible",
            );

            cy.get('input[id="search"]').should("be.visible");
            cy.get('button[id="create-button"]').should("be.visible");
            cy.get("table").should("be.visible");

            cy.wait("@getVehicles").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 304]);
            });
        });

        it("should show validation errors when creating a vehicle with empty fields", () => {
            cy.visit("/owner/vehicles");

            cy.get('button[id="create-button"]').click();
            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Nuevo vehículo").should("be.visible");

            cy.get('button[class="swal2-confirm swal2-styled"]').click();
            cy.wait(500);

            cy.contains("Revisa los campos marcados en rojo")
                .scrollIntoView()
                .should("be.visible");
        });

        it("should create a new vehicle", () => {
            cy.intercept("POST", "**/api/v1/vehicles").as("createVehicle");
            cy.intercept("GET", "**/branches*").as("getBranches");

            cy.visit("/owner/vehicles");

            cy.get('button[id="create-button"]').click();
            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");

            cy.get('input[id="v-plate"]').type(vehicle.plate);
            cy.get('input[id="v-brand"]').type(vehicle.brand);
            cy.get('input[id="v-model"]').type(vehicle.model);
            cy.get('input[id="v-year"]').clear().type(vehicle.year.toString());
            cy.get('input[id="v-color"]').type(vehicle.color);
            cy.get('select[id="v-transmission"]').select(vehicle.transmission);
            cy.get('input[id="v-rentalPriceByDay"]')
                .clear()
                .type(vehicle.rentalPriceByDay.toString());

            // Owner must pick a branch
            cy.contains("Seleccionar sede...").should("exist").click();
            cy.wait("@getBranches");
            cy.wait(500);
            cy.get(".swal2-popup").within(() => {
                cy.contains("Sede 0").click({ force: true });
            });

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@createVehicle").then((interception) => {
                expect(interception.response!.statusCode).to.be.oneOf([
                    200, 201,
                ]);
                createdVehicleId = interception.response!.body.id;
            });

            cy.wait(2000);
            cy.contains("Vehículo creado").should("be.visible");
        });

        it("should search for the created vehicle by plate", () => {
            cy.intercept("GET", "**/api/v1/vehicles*").as("searchVehicles");

            cy.visit("/owner/vehicles");

            cy.get('input[id="search"]').type(vehicle.plate);

            cy.wait("@searchVehicles");
            cy.wait(500);

            cy.contains(vehicle.plate).should("be.visible");
        });

        it("should view vehicle detail", () => {
            cy.visit("/owner/vehicles");

            cy.get('input[id="search"]').type(vehicle.plate);
            cy.wait(1000);

            // Click the info button
            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.get("button").first().click({ force: true });
                });

            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains(vehicle.brand).should("be.visible");
        });

        it("should edit the vehicle", () => {
            cy.intercept("PUT", "**/api/v1/vehicles/*").as("updateVehicle");

            cy.visit("/owner/vehicles");

            cy.get('input[id="search"]').type(vehicle.plate);
            cy.wait(1000);

            // Find the edit (slate) button
            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.get("button").eq(1).click({ force: true });
                });

            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Editar").should("be.visible");

            cy.get('input[id="v-color"]').clear().type("Negro");

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@updateVehicle").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 201]);
            });

            cy.wait(2000);
            cy.contains("Vehículo editado").should("be.visible");
        });

        it("should change vehicle status", () => {
            cy.intercept("PUT", "**/api/v1/vehicles/*").as("updateStatus");

            cy.visit("/owner/vehicles");

            cy.get('input[id="search"]').type(vehicle.plate);
            cy.wait(1000);

            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.contains("Estado").click({ force: true });
                });

            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Cambiar estado").should("be.visible");

            cy.get("select#v-status").should("exist");
            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@updateStatus").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 201]);
            });

            cy.wait(2000);
            cy.contains("Estado actualizado").should("be.visible");
        });

        it("should delete the vehicle", () => {
            cy.intercept("DELETE", "**/api/v1/vehicles/*").as("deleteVehicle");

            cy.visit("/owner/vehicles");

            cy.get('input[id="search"]').type(vehicle.plate);
            cy.wait(1000);

            cy.get("table tbody tr")
                .first()
                .within(() => {
                    cy.get(
                        `button[id="delete-vehicle-${vehicle.plate}"]`,
                    ).click({ force: true });
                });

            cy.wait(500);
            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Eliminar").should("be.visible");

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@deleteVehicle").then(({ response }) => {
                expect(response!.statusCode).to.eq(200);
            });

            cy.wait(2000);
            cy.contains("Eliminado").should("be.visible");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Admin — can view vehicles but NOT create/edit/delete
    // ─────────────────────────────────────────────────────────────────────────
    describe("Admin RentCheck", () => {
        beforeEach(() => {
            cy.login();
        });

        it("should display the vehicles page", () => {
            cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

            cy.visit("/adm/vehicles");

            cy.contains("Vehículos").should("be.visible");
            cy.get("table").should("be.visible");

            cy.wait("@getVehicles").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 304]);
            });
        });

        it("should NOT show a create button for admin", () => {
            cy.visit("/adm/vehicles");
            cy.get('button[id="create-button"]').should("not.exist");
        });

        it("should NOT show edit/delete/status buttons for admin", () => {
            cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

            cy.visit("/adm/vehicles");
            cy.wait("@getVehicles");
            cy.wait(500);

            cy.get("body").then(($body) => {
                if ($body.find("table tbody tr").length > 0) {
                    cy.get("table tbody tr")
                        .first()
                        .within(() => {
                            cy.contains("Estado").should("not.exist");
                            cy.contains("Editar").should("not.exist");
                        });
                }
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Employee — can view and check availability but NOT create/edit/delete
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

        it("should display the vehicles page", () => {
            cy.intercept("GET", "**/api/v1/vehicles*").as("getVehicles");

            cy.visit("/employee/vehicles");

            cy.contains("Vehículos").should("be.visible");
            cy.get("table").should("be.visible");

            cy.wait("@getVehicles").then(({ response }) => {
                expect(response!.statusCode).to.be.oneOf([200, 304]);
            });
        });

        it("should NOT show create button for employee", () => {
            cy.visit("/employee/vehicles");
            cy.get('button[id="create-button"]').should("not.exist");
        });

        it("should be able to consult availability from vehicles page", () => {
            cy.visit("/employee/vehicles");
            cy.contains("Consultar disponibilidad").should("be.visible");
        });

        it("should NOT be able to access owner vehicle management", () => {
            cy.visit("/owner/vehicles");
            cy.url().should("include", "/unauthorized");
        });
    });
});
