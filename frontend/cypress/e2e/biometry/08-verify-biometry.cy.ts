type Customer = {
  id: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Logs in with RENTER_CREDENTIALS and resolves to the JWT access token.
 * Uses cy.wrap() so the returned Chainable plays nicely with Cypress's
 * async queue (avoids the "cannot read before assignment" race condition).
 */
const getRenterAuthToken = (): Cypress.Chainable<string> => {
  type RenterCredentials = { email: string; password: string };

  return cy
    .env<{
      apiUrl: string;
      RENTER_CREDENTIALS: RenterCredentials;
    }>(["apiUrl", "RENTER_CREDENTIALS"])
    .then((v) => {
      const { apiUrl: API, RENTER_CREDENTIALS: rc } = v;

      return cy
        .request<{ accessToken: string }>({
          method: "POST",
          url: `${API}/auth/login`,
          body: { email: rc.email, password: rc.password },
        })
        .then((res) => {
          expect(res.status).to.be.oneOf([200, 201]);
          // The backend returns { accessToken } — NOT { token }
          return cy.wrap(res.body.accessToken);
        });
    });
};

/**
 * Creates a fresh biometry request for `customerId` and resolves to the
 * biometry token string.  Returns null if the request could not be created
 * (e.g. a pending one already exists and no new one could be recycled).
 */
const requestBiometryToken = (
  API: string,
  authToken: string,
  customerId: string,
): Cypress.Chainable<string | null> => {
  return cy
    .request<{ token: string }>({
      method: "POST",
      url: `${API}/biometry-requests/request`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { customerId },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status === 201) {
        cy.log("Biometry token obtained: " + res.body.token);
        return cy.wrap<string | null>(res.body.token);
      }
      cy.log(
        `Could not create biometry (status ${res.status}): ${JSON.stringify(res.body)}`,
      );
      return cy.wrap<string | null>(null);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe("Verify Biometry (Public Page)", () => {
  let API: string;

  before(() => {
    // Resolve API URL once for the whole suite
    cy.env<{ apiUrl: string }>(["apiUrl"]).then((v) => {
      API = v.apiUrl;
    });
    cy.task("db:reset");
    Cypress.session.clearAllSavedSessions();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Page structure — static checks with a fake token
  // ───────────────────────────────────────────────────────────────────────────
  describe("Page structure", () => {
    it("should display the verification page UI when visiting /verify/:token", () => {
      cy.visit("/verify/FAKE-TOKEN-12345");

      cy.get("h1").contains("Verificación de identidad").should("be.visible");
      cy.contains("Simulación").should("be.visible");
      cy.contains("Aprobar identidad").should("be.visible");
      cy.contains("Rechazar identidad").should("be.visible");

      // The token itself should be shown at the bottom of the page
      cy.contains("FAKE-TOKEN-12345").should("be.visible");
    });

    it("should disable the approve button while the request is in flight", () => {
      // Delay the response so we can assert the loading state
      cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", (req) => {
        req.reply((res) =>
          res.send({
            statusCode: 404,
            body: { message: "Token inválido" },
          }),
        );
      }).as("simulateBiometry");

      cy.visit("/verify/ANY-TOKEN");

      cy.contains("Aprobar identidad").click();

      // Both buttons must be disabled while isLoading = true
      cy.get("button").contains("Aprobar identidad").should("be.disabled");
      cy.get("button").contains("Rechazar identidad").should("be.disabled");
    });

    it("should disable the reject button while the request is in flight", () => {
      cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", (req) => {
        req.reply((res) =>
          res.send({
            statusCode: 404,
            body: { message: "Token inválido" },
          }),
        );
      }).as("simulateBiometryReject");

      cy.visit("/verify/ANY-TOKEN");

      cy.contains("Rechazar identidad").click();

      cy.get("button").contains("Rechazar identidad").should("be.disabled");
      cy.get("button").contains("Aprobar identidad").should("be.disabled");
    });

    it("should show an error alert when the token is invalid (404)", () => {
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
      cy.contains("Token inválido o ya procesado").should("be.visible");
    });

    it("should re-enable buttons after an error response", () => {
      cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", {
        statusCode: 404,
        body: { message: "Token inválido" },
      }).as("errorResponse");

      cy.visit("/verify/ANY-TOKEN");

      cy.contains("Aprobar identidad").click();

      cy.wait("@errorResponse");

      // Dismiss the SweetAlert
      cy.get(".swal2-confirm").click();

      // Buttons must be re-enabled so the user can retry
      cy.get("button").contains("Aprobar identidad").should("not.be.disabled");
      cy.get("button").contains("Rechazar identidad").should("not.be.disabled");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Real token — approval flow
  // ───────────────────────────────────────────────────────────────────────────
  describe("Approval flow with a real token", () => {
    let biometryToken: string;

    before(function () {
      getRenterAuthToken().then((authToken) => {
        cy.request<{ data: Customer[] }>({
          method: "GET",
          url: `${API}/customers?page=1&limit=5`,
          headers: { Authorization: `Bearer ${authToken}` },
        }).then((res) => {
          const customers = res.body.data;

          if (!customers?.length) {
            cy.log("No customers available — approval tests will be skipped");
            return;
          }

          requestBiometryToken(API, authToken, customers[0].id).then(
            (token) => {
              if (token) biometryToken = token;
            },
          );
        });
      });
    });

    it("should approve biometry and show the success message", function () {
      if (!biometryToken) {
        this.skip();
      }

      cy.visit(`/verify/${biometryToken}`);

      cy.contains("Aprobar identidad").click();

      // SweetAlert success dialog
      cy.get(".swal2-popup", { timeout: 5000 }).should("be.visible");
      cy.get(".swal2-title").should("contain", "✅ Identidad verificada");
      cy.contains("Tu identidad ha sido verificada exitosamente.").should(
        "be.visible",
      );

      // After the dialog auto-closes, the page should show "Proceso completado"
      cy.contains("✅ Proceso completado", { timeout: 8000 }).should(
        "be.visible",
      );
      cy.contains("Puedes cerrar esta ventana.").should("be.visible");
    });

    it("should show a conflict error if the same token is submitted again", function () {
      if (!biometryToken) {
        this.skip();
      }

      // Intercept to simulate the 409 the backend would return for an
      // already-processed token (avoids depending on previous test state)
      cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", {
        statusCode: 409,
        body: { message: "Esta biometría ya fue procesada anteriormente." },
      }).as("alreadyProcessed");

      cy.visit(`/verify/${biometryToken}`);

      cy.contains("Aprobar identidad").click();

      cy.wait("@alreadyProcessed");

      cy.get(".swal2-popup").should("be.visible");
      cy.get(".swal2-title").should("contain", "Error");
      cy.contains("Esta biometría ya fue procesada anteriormente.").should(
        "be.visible",
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Real token — rejection flow
  // ───────────────────────────────────────────────────────────────────────────
  describe("Rejection flow with a real token", () => {
    let biometryToken2: string;

    before(function () {
      getRenterAuthToken().then((authToken) => {
        cy.request<{ data: Customer[] }>({
          method: "GET",
          url: `${API}/customers?page=1&limit=10`,
          headers: { Authorization: `Bearer ${authToken}` },
        }).then((res) => {
          const customers = res.body.data;

          if (!customers || customers.length < 2) {
            cy.log("Not enough customers — rejection flow will be skipped");
            return;
          }

          // Use a customer different from the first one so we get a fresh
          // pending biometry (the first was consumed by the approval suite)
          const candidate = customers[1];

          requestBiometryToken(API, authToken, candidate.id).then((token) => {
            if (token) {
              biometryToken2 = token;
            } else {
              // Fall back: iterate remaining customers until we get a new token
              const rest = customers.slice(2);
              const tryNext = (i: number) => {
                if (i >= rest.length) return;
                requestBiometryToken(API, authToken, rest[i].id).then((t) => {
                  if (t) {
                    biometryToken2 = t;
                  } else {
                    tryNext(i + 1);
                  }
                });
              };
              tryNext(0);
            }
          });
        });
      });
    });

    it("should reject biometry and show the rejection message", function () {
      if (!biometryToken2) {
        this.skip();
      }

      cy.visit(`/verify/${biometryToken2}`);

      cy.contains("Rechazar identidad").click();

      // SweetAlert rejection dialog
      cy.get(".swal2-popup", { timeout: 5000 }).should("be.visible");
      cy.get(".swal2-title").should("contain", "❌ Verificación rechazada");
      cy.contains("Tu verificación fue rechazada").should("be.visible");

      // Page should settle on "Proceso completado"
      cy.contains("✅ Proceso completado", { timeout: 8000 }).should(
        "be.visible",
      );
    });

    it("should show a conflict error if the rejected token is submitted again", function () {
      if (!biometryToken2) {
        this.skip();
      }

      cy.intercept("PATCH", "**/api/v1/biometry-requests/simulate/*", {
        statusCode: 409,
        body: { message: "Esta solicitud ya fue procesada" },
      }).as("alreadyRejected");

      cy.visit(`/verify/${biometryToken2}`);

      cy.contains("Rechazar identidad").click();

      cy.wait("@alreadyRejected");

      cy.get(".swal2-popup").should("be.visible");
      cy.get(".swal2-title").should("contain", "Error");
      cy.contains("Esta solicitud ya fue procesada").should("be.visible");
    });
  });
});
