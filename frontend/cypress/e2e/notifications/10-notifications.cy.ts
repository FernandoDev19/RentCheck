/**
 * 10-notifications.cy.ts
 *
 * Covers the Notification Bell:
 *   - Bell visible in header for all authenticated roles
 *   - Opens dropdown when clicked
 *   - Shows "Sin notificaciones" when empty
 *   - Can mark a single notification as read (dismiss)
 *   - Can mark all as read
 *   - Unread badge count reflects number of notifications
 *
 * Roles tested:
 *   - Owner  (/owner/dashboard)
 *   - Admin  (/adm/dashboard)
 *   - Employee (/employee/dashboard)
 */

describe("Notifications", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");
  const ec = Cypress.env("EMPLOYEE_CREDENTIALS");

  // ─────────────────────────────────────────────────────────────────────────
  // Owner
  // ─────────────────────────────────────────────────────────────────────────
  describe("Owner (Renter)", () => {
    beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();

      cy.login({
        email: rc.email,
        password: rc.password,
        redirectTo: rc.redirectTo,
      });
    });

    it("should display the notification bell in the header", () => {
      cy.visit("/owner/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open the notifications dropdown when clicking the bell", () => {
      cy.intercept("GET", "**/api/v1/notifications*").as("getNotifications");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();

      cy.wait(500);

      // Dropdown should be visible
      cy.get('ul').should("be.visible");

      // Either shows notifications or empty state
      cy.get("body").then(($body) => {
        const text = $body.text();
        const hasEmpty = text.includes("Sin notificaciones");
        const hasItems = $body.find('[id^="notification-read-"]').length > 0;

        expect(hasEmpty || hasItems).to.be.true;
      });
    });

    it("should show empty state when no notifications exist", () => {
      cy.intercept("GET", "**/api/v1/notifications*", {
        statusCode: 200,
        body: [],
      }).as("emptyNotifications");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait("@emptyNotifications");
      cy.wait(300);

      cy.contains("Sin notificaciones pendientes").should("be.visible");
    });

    it("should show notification items when they exist", () => {
      cy.intercept("GET", "**/api/v1/notifications*", {
        statusCode: 200,
        body: [
          {
            id: "notif-1",
            renterId: "renter-1",
            branchId: null,
            employeeId: null,
            type: "low_balance",
            payload: {
              message: "Saldo bajo: $10.000 (umbral configurado: $50.000).",
              balance: 10000,
              threshold: 50000,
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "notif-2",
            renterId: "renter-1",
            branchId: null,
            employeeId: null,
            type: "late_rental",
            payload: {
              message: "Una renta venció sin ser devuelta.",
              rentalId: "rental-1",
            },
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }).as("mockNotifications");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait("@mockNotifications");
      cy.wait(300);

      // Badge should show count
      cy.get('button[id="notification-bell-btn"]').within(() => {
        cy.get("span").contains("2").should("be.visible");
      });

      // Notification content visible
      cy.contains("Saldo bajo").should("be.visible");
    });

    it("should mark a single notification as read when clicking the X", () => {
      cy.intercept("GET", "**/api/v1/notifications*", {
        statusCode: 200,
        body: [
          {
            id: "notif-dismiss",
            renterId: "renter-1",
            branchId: null,
            employeeId: null,
            type: "feedback_pending",
            payload: { message: "La renta fue devuelta y no tiene feedback." },
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }).as("mockSingleNotif");

      cy.intercept("PATCH", "**/api/v1/notifications/notif-dismiss/read", {
        statusCode: 200,
        body: {},
      }).as("markRead");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait("@mockSingleNotif");
      cy.wait(300);

      cy.get('button[id="notification-read-notif-dismiss"]').click({ force: true });

      cy.wait("@markRead").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });
    });

    it("should mark all notifications as read when clicking 'Marcar todas'", () => {
      cy.intercept("GET", "**/api/v1/notifications*", {
        statusCode: 200,
        body: [
          {
            id: "notif-a",
            renterId: "renter-1",
            branchId: null,
            employeeId: null,
            type: "plan_expiring_soon",
            payload: { message: 'Tu plan "Basic" vence en 7 días.' },
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }).as("mockNotifMarkAll");

      cy.intercept("PATCH", "**/api/v1/notifications/read-all", {
        statusCode: 200,
        body: {},
      }).as("markAllRead");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait("@mockNotifMarkAll");
      cy.wait(300);

      cy.get('button[id="notification-mark-all-read"]').click({ force: true });

      cy.wait("@markAllRead").then(({ response }) => {
        expect(response!.statusCode).to.eq(200);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin RentCheck", () => {
    beforeEach(() => {
      cy.login();
    });

    it("should display the notification bell in the admin header", () => {
      cy.visit("/adm/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open dropdown and show empty or notifications", () => {
      cy.intercept("GET", "**/api/v1/notifications*").as("getAdminNotifications");

      cy.visit("/adm/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait(500);

      cy.get("body").then(($body) => {
        expect(
          $body.text().includes("Sin notificaciones") ||
          $body.find('[id^="notification-read-"]').length > 0
        ).to.be.true;
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Employee
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

    it("should display the notification bell for employee", () => {
      cy.visit("/employee/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open and close the notification dropdown", () => {
      cy.visit("/employee/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait(300);

      // Close by clicking somewhere else
      cy.get("main").click({ force: true });
      cy.wait(300);
    });
  });
});