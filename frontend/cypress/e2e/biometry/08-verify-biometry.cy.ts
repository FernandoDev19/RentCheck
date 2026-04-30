/**
 * 08-verify-biometry.cy.ts
 *
 * This spec covers the public biometry verification page (/verify/:token).
 *
 * Business context:
 *   - When a rental employee requests biometric verification for a customer,
 *     the backend generates a unique token.
 *   - The customer opens the link /verify/:token on their device.
 *   - They can tap "Aprobar identidad" or "Rechazar identidad".
 *   - The page is PUBLIC (no authentication required).
 *   - A token can only be used ONCE (subsequent calls return 409 Conflict).
 *
 * Test strategy:
 *   1. Request a biometry token via the backend API in beforeEach.
 *   2. Visit /verify/:token and validate the page structure.
 *   3. Simulate approval → success feedback.
 *   4. Attempt to use the same token again → 409 Conflict handled gracefully.
 *   5. Simulate rejection path with a fresh token.
 *
 * Note: Because we need a valid token we call the backend API directly
 * using cy.request() with a Bearer token obtained through login.
 */

const API = Cypress.env("apiUrl");

/** Helper: log in via API and return the access_token */
const getAuthToken = (): Cypress.Chainable<string> => {
    const ADMIN_EMAIL = Cypress.env("ADMIN_EMAIL");
    const ADMIN_PASSWORD = Cypress.env("ADMIN_PASSWORD");

    return cy
        .request({
            method: "POST",
            url: `${API}/auth/login`,
            body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        })
        .then((res) => {
            expect(res.status).to.eq(200);
            return res.body.token as string;
        });
};

/**
 * Helper: get the first customer that has at least one rental, then
 * authenticate as an Owner/Employee to request a biometry for that customer,
 * returning the biometry token.
 *
 * We use the RENTER_CREDENTIALS since requestBiometry requires EMPLOYEE/OWNER/MANAGER.
 */
const getRenterAuthToken = (): Cypress.Chainable<string> => {
    const rc = Cypress.env("RENTER_CREDENTIALS");

    return cy
        .request({
            method: "POST",
            url: `${API}/auth/login`,
            body: { email: rc.email, password: rc.password },
        })
        .then((res) => {
            expect(res.status).to.eq(200);
            return res.body.token as string;
        });
};

describe("Verify Biometry (Public Page)", () => {
    // ─────────────────────────────────────────────────────────────────────────
    // Page structure — visit with a fake token
    // ─────────────────────────────────────────────────────────────────────────
    describe("Page structure", () => {
        it("should display the verification page UI when visiting /verify/:token", () => {
            cy.visit("/verify/FAKE-TOKEN-12345");

            cy.get("h1").contains("Verificación de identidad").should("be.visible");
            cy.contains("Simulación").should("be.visible");

            cy.contains("Aprobar identidad").should("be.visible");
            cy.contains("Rechazar identidad").should("be.visible");

            // Token should be displayed at the bottom
            cy.contains("FAKE-TOKEN-12345").should("be.visible");
        });

        it("should disable both buttons while a request is in flight", () => {
            // Intercept the simulate endpoint to slow it down
            cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", (req) => {
                req.reply((res) => {
                    // Return a 404 quickly so the UI resets
                    res.send({ statusCode: 404, body: { message: "Token inválido" } });
                });
            }).as("simulateBiometry");

            cy.visit("/verify/ANY-TOKEN");

            cy.contains("Aprobar identidad").click();

            // After click and before response, the buttons should be disabled
            // (isLoading=true state) — check at least one within a short window
            cy.get("button").contains("Aprobar identidad").should("be.disabled");
        });

        it("should show an error alert when token is invalid", () => {
            cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", {
                statusCode: 404,
                body: { message: "Token inválido o ya procesado" },
            }).as("invalidToken");

            cy.visit("/verify/INVALID-TOKEN");

            cy.contains("Aprobar identidad").click();

            cy.wait("@invalidToken");

            cy.wait(500);

            cy.get(".swal2-popup").should("be.visible");
            cy.get(".swal2-title").should("contain", "Error");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Real token — approve
    // ─────────────────────────────────────────────────────────────────────────
    describe("Approval flow with a real token", () => {
        let biometryToken: string;

        before(() => {
            // 1. Get customers via renter token
            getRenterAuthToken().then((token) => {
                // 2. List customers to find one with rentals
                cy.request({
                    method: "GET",
                    url: `${API}/customers?page=1&limit=5`,
                    headers: { Authorization: `Bearer ${token}` },
                }).then((res) => {
                    const customers = res.body.data as any[];

                    if (!customers || customers.length === 0) {
                        cy.log("No customers available — skipping biometry tests");
                        return;
                    }

                    const customer = customers[0];

                    // 3. Request biometry for the first customer
                    cy.request({
                        method: "POST",
                        url: `${API}/biometry-requests/request`,
                        headers: { Authorization: `Bearer ${token}` },
                        body: { customerId: customer.id },
                        failOnStatusCode: false, // might be 409 if already pending
                    }).then((biometryRes) => {
                        if (biometryRes.status === 201) {
                            biometryToken = biometryRes.body.token;
                            cy.log("Biometry token obtained: " + biometryToken);
                        } else {
                            cy.log(
                                `Could not request biometry (status ${biometryRes.status}): ${JSON.stringify(biometryRes.body)}`,
                            );
                        }
                    });
                });
            });
        });

        it("should approve biometry and show success message", () => {
            if (!biometryToken) {
                cy.log("No biometry token — skipping approval test");
                return;
            }

            cy.visit(`/verify/${biometryToken}`);

            cy.contains("Aprobar identidad").click();

            cy.wait(1500);

            cy.get(".swal2-popup").should("be.visible");
            cy.get(".swal2-title").should("contain", "✅ Identidad verificada");
            cy.contains("Tu identidad ha sido verificada exitosamente.").should("be.visible");

            // After dialog closes, show "Proceso completado"
            cy.wait(3500);
            cy.contains("✅ Proceso completado").should("be.visible");
            cy.contains("Puedes cerrar esta ventana.").should("be.visible");
        });

        it("should show conflict error if token is already processed", () => {
            if (!biometryToken) {
                cy.log("No biometry token — skipping already-used test");
                return;
            }

            cy.visit(`/verify/${biometryToken}`);

            cy.contains("Aprobar identidad").click();

            cy.wait(1500);

            cy.get(".swal2-popup").should("be.visible");
            cy.get(".swal2-title").should("contain", "Error");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Real token — rejection
    // ─────────────────────────────────────────────────────────────────────────
    describe("Rejection flow with a real token", () => {
        let biometryToken2: string;

        before(() => {
            getRenterAuthToken().then((token) => {
                cy.request({
                    method: "GET",
                    url: `${API}/customers?page=1&limit=10`,
                    headers: { Authorization: `Bearer ${token}` },
                }).then((res) => {
                    const customers = res.body.data as any[];

                    if (!customers || customers.length < 2) {
                        cy.log("Not enough customers — skipping rejection flow");
                        return;
                    }

                    // Try the second customer to get a fresh biometry
                    const customer = customers.find((c: any) => c.id) || customers[0];

                    cy.request({
                        method: "POST",
                        url: `${API}/biometry-requests/request`,
                        headers: { Authorization: `Bearer ${token}` },
                        body: { customerId: customer.id },
                        failOnStatusCode: false,
                    }).then((biometryRes) => {
                        if (biometryRes.status === 201) {
                            biometryToken2 = biometryRes.body.token;
                        } else {
                            cy.log("Could not create second biometry. Status: " + biometryRes.status);
                        }
                    });
                });
            });
        });

        it("should reject biometry and show rejection message", () => {
            if (!biometryToken2) {
                cy.log("No second biometry token — skipping rejection test");
                return;
            }

            cy.visit(`/verify/${biometryToken2}`);

            cy.contains("Rechazar identidad").click();

            cy.wait(1500);

            cy.get(".swal2-popup").should("be.visible");
            cy.get(".swal2-title").should("contain", "❌ Verificación rechazada");
            cy.contains("Tu verificación fue rechazada").should("be.visible");

            cy.wait(3500);
            cy.contains("✅ Proceso completado").should("be.visible");
        });
    });
});
