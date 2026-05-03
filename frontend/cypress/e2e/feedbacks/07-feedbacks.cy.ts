/**
 * 07-feedbacks.cy.ts
 *
 * This spec covers the Pending Feedbacks module:
 *   - Page structure (title, table, search, action buttons)
 *   - Empty state when no pending feedbacks
 *   - Opening the feedback form for a returned rental
 *   - Validation: all score fields must be rated before save
 *   - Using critical flags forces all scores to 1
 *   - Successful feedback submission updates the list
 *   - Role-based access: Admin cannot access /owner/feedbacks
 *
 * Roles tested:
 *   - Owner  (/owner/feedbacks)
 */

describe("Pending Feedbacks", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");

  before(() => {
    cy.task("db:reset");
  });

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

    it("should display the pending feedbacks page with correct structure", () => {
      cy.visit("/owner/rentals");

      cy.contains("Estado").should("exist").click();

      cy.get("table tbody")
        .find(
          "button.cursor-pointer.px-3.py-2.text-xs.rounded-md.bg-green-50.text-green-600.hover\\:bg-green-100.transition",
        )
        .first()
        .click({ force: true });

      cy.get(".swal2-popup").should("be.visible");
      cy.contains("¿Marcar como devuelto?").should("be.visible");
      cy.contains(
        "¿Estás seguro de que quieres marcar esta renta como devuelto?",
      ).should("be.visible");
      cy.get("button.swal2-confirm.swal2-styled")
        .first()
        .click({ force: true });

      cy.wait(500);

      cy.get("#swal2-title").should("be.visible");
      cy.get("button.swal2-cancel.swal2-styled").first().click();

      //   cy.wait("@markAsReturned").then(({ response }) => {
      //     expect(response!.statusCode).to.be.oneOf([200, 201]);
      //   });

      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "getPendingFeedbacks",
      );

      cy.visit("/owner/feedbacks");

      cy.wait("@getPendingFeedbacks").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });

      cy.get('input[id="search"]').should("be.visible");
      cy.get("table").should("be.visible");
      cy.get("table tbody tr").should("have.length.gte", 1);
    });

    it("should show the empty state message when no pending feedbacks", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*", {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, lastPage: 1 },
      }).as("emptyFeedbacks");

      cy.visit("/owner/feedbacks");

      cy.wait("@emptyFeedbacks");

      cy.contains("No hay rentas pendientes de feedback 🎉").should(
        "be.visible",
      );
    });

    it("should search in the pending feedbacks list", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "searchFeedbacks",
      );

      cy.visit("/owner/feedbacks");

      cy.get('input[id="search"]').type("Carlos");

      cy.wait("@searchFeedbacks");
      cy.wait(500);

      // Result or empty message should be visible
      cy.get("body").then(($body) => {
        const text = $body.text();
        if (text.includes("No hay rentas pendientes")) {
          cy.contains("No hay rentas pendientes de feedback 🎉").should(
            "be.visible",
          );
        } else {
          cy.get("table tbody tr").should("have.length.gte", 1);
        }
      });
    });

    it("should open the feedback form when clicking '✍️ Dar feedback'", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "getPending",
      );

      cy.visit("/owner/feedbacks");

      cy.wait("@getPending").then(({ response }) => {
        const rentals = response!.body.data;

        if (!rentals || rentals.length === 0) {
          cy.log("No pending feedbacks; skipping form test");
          return;
        }

        cy.contains("✍️ Dar feedback").first().click();

        cy.wait(500);

        cy.get('div[class*="swal2-container"]').should("be.visible");
        cy.contains("Feedback").should("be.visible");

        // Score fields should be visible
        cy.contains("Calificación (1 = Peor, 5 = Mejor)").should("be.visible");

        // Critical flag checkboxes
        cy.get('input[id="flag-vehicleTheft"]').should("exist");
        cy.get('input[id="flag-impersonation"]').should("exist");

        // Comments textarea
        cy.get('textarea[id="feedback-comments"]').should("be.visible");

        // Close without submitting
        cy.get('button[class="swal2-cancel swal2-styled"]').click();
      });
    });

    it("should show validation message when submitting feedback without scoring all fields", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "getPending2",
      );

      cy.visit("/owner/feedbacks");

      cy.wait("@getPending2").then(({ response }) => {
        const rentals = response!.body.data;

        if (!rentals || rentals.length === 0) {
          cy.log("No pending feedbacks; skipping validation test");
          return;
        }

        cy.contains("✍️ Dar feedback").first().click();
        cy.wait(500);

        // Click confirm without selecting any score
        cy.get('button[class="swal2-confirm swal2-styled"]').click();
        cy.wait(300);

        // Should show a validation error about missing score
        cy.contains("Por favor califica").should("be.visible");
      });
    });

    it("should activate critical flags and force all scores to 1", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "getPending3",
      );

      cy.visit("/owner/feedbacks");

      cy.wait("@getPending3").then(({ response }) => {
        const rentals = response!.body.data;

        if (!rentals || rentals.length === 0) {
          cy.log("No pending feedbacks; skipping flag test");
          return;
        }

        cy.contains("✍️ Dar feedback").first().click();
        cy.wait(500);

        // Check vehicleTheft flag
        cy.get('input[id="flag-vehicleTheft"]').check({ force: true });

        // Warning banner should appear
        cy.contains(
          "Flag crítico activo — todas las calificaciones se fijan en 1",
        ).should("be.visible");

        // All score radio buttons with value=1 should now be checked
        cy.get('input[type="radio"][value="1"]').each(($radio) => {
          cy.wrap($radio).should("be.checked");
        });

        // Close without submitting
        cy.get('button[class="swal2-cancel swal2-styled"]').click();
      });
    });

    it("should submit feedback successfully when all scores are provided", () => {
      cy.intercept("GET", "**/api/v1/rentals/pending-feedback*").as(
        "getPending4",
      );
      cy.intercept("POST", "**/api/v1/rental-feedbacks").as("createFeedback");

      cy.visit("/owner/feedbacks");

      cy.wait("@getPending4").then(({ response }) => {
        const rentals = response!.body.data;

        if (!rentals || rentals.length === 0) {
          cy.log("No pending feedbacks; skipping submission test");
          return;
        }

        cy.contains("✍️ Dar feedback").first().click();
        cy.wait(500);

        // Rate each score field with 5 (best)
        const scoreFields = [
          "damageToCar",
          "unpaidFines",
          "arrears",
          "carAbuse",
          "badAttitude",
        ];
        scoreFields.forEach((field) => {
          cy.get(`input[name="score-${field}"][value="5"]`).check({
            force: true,
          });
        });

        // Optional comment
        cy.get('textarea[id="feedback-comments"]').type(
          "Cypress automated feedback test.",
        );

        cy.get('button[class="swal2-confirm swal2-styled"]').click();

        cy.wait("@createFeedback").then(({ response }) => {
          expect(response!.statusCode).to.be.oneOf([200, 201]);
        });

        cy.wait(2000);
        cy.contains("Feedback guardado").should("be.visible");
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Manager — /manager/feedbacks
  // ─────────────────────────────────────────────────────────────────────────
  describe("Manager", () => {
    const manager = Cypress.env("MANAGER_CREDENTIALS");

    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      Cypress.session.clearAllSavedSessions();

      cy.login({
        email: manager.email,
        password: manager.password,
        redirectTo: manager.redirectTo,
      });
    });

    it("should display the pending feedbacks page and mark a rental as returned", () => {
      cy.visit("/manager/rentals");

      // Find an active rental and return it
      cy.contains("Estado").should("exist").click();
      cy.get("table tbody")
        .find(
          "button.cursor-pointer.px-3.py-2.text-xs.rounded-md.bg-green-50.text-green-600.hover\\:bg-green-100.transition",
        )
        .first()
        .click({ force: true });

      cy.get(".swal2-popup").should("be.visible");
      cy.get("button.swal2-confirm.swal2-styled")
        .first()
        .click({ force: true });
      cy.wait(500);
      cy.get("button.swal2-cancel.swal2-styled").first().click();

      cy.visit("/manager/feedbacks");

      cy.get('input[id="search"]').should("be.visible");
      cy.get("table tbody tr").should("have.length.gte", 1);
    });

    it("should open feedback form and verify critical flags logic", () => {
      cy.visit("/manager/feedbacks");

      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length > 0) {
          cy.contains("✍️ Dar feedback").first().click();
          cy.wait(500);

          cy.get('input[id="flag-impersonation"]').check({ force: true });
          cy.contains("Flag crítico activo").should("be.visible");
          cy.get('input[type="radio"][value="1"]').each(($radio) => {
            cy.wrap($radio).should("be.checked");
          });

          cy.get('button[class="swal2-cancel swal2-styled"]').click();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Employee — /employee/feedbacks
  // ─────────────────────────────────────────────────────────────────────────
  describe("Employee", () => {
    const employee = Cypress.env("EMPLOYEE_CREDENTIALS");

    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      Cypress.session.clearAllSavedSessions();

      cy.login({
        email: employee.email,
        password: employee.password,
        redirectTo: employee.redirectTo,
      });
    });

    it("should display the pending feedbacks page", () => {
      cy.visit("/employee/feedbacks");

      cy.get("table").should("be.visible");
    });

    it("should be able to submit a feedback", () => {
      cy.intercept("POST", "**/api/v1/rental-feedbacks").as(
        "createFeedbackEmp",
      );

      cy.visit("/employee/feedbacks");

      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length > 0) {
          cy.contains("✍️ Dar feedback").first().click();
          cy.wait(500);

          const scoreFields = [
            "damageToCar",
            "unpaidFines",
            "arrears",
            "carAbuse",
            "badAttitude",
          ];
          scoreFields.forEach((field) => {
            cy.get(`input[name="score-${field}"][value="4"]`).check({
              force: true,
            });
          });

          cy.get('button[class="swal2-confirm swal2-styled"]').click();

          cy.wait("@createFeedbackEmp").then(({ response }) => {
            expect(response!.statusCode).to.be.oneOf([200, 201]);
          });

          cy.contains("Feedback guardado").should("be.visible");
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin — should not have access to /owner/feedbacks
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin RentCheck", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should redirect admin away from /owner/feedbacks", () => {
      cy.visit("/owner/feedbacks");
      cy.url().should("include", "/unauthorized");
    });
  });
});
