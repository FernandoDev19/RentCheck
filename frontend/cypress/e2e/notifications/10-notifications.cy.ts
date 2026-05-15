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
      cy.login({
        email: rc.email,
        password: rc.password,
        redirectTo: rc.redirectTo,
        skipRedirect: true, // Evitamos el visit automático para controlar cuándo ocurre la carga
      });
    });

    it("should display the notification bell in the header", () => {
      cy.visit("/owner/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open the notifications dropdown when clicking the bell", () => {
      // Interceptamos antes del visit
      cy.intercept("GET", "**/api/v1/notifications/unread").as("getNotifications");

      cy.visit("/owner/dashboard");
      
      // Esperamos a que carguen las notificaciones (aunque sean vacías)
      cy.wait("@getNotifications");

      cy.get('button[id="notification-bell-btn"]').click();

      // El dropdown debe ser visible. Usamos un selector más específico si es posible, 
      // o verificamos que el contenedor del dropdown exista.
      cy.get('button[id="notification-bell-btn"]').parent().within(() => {
        cy.get("ul").should("be.visible");
      });

      // Verificamos que tenga contenido o estado vacío
      cy.get("body").then(($body) => {
        const text = $body.text();
        const hasEmpty = text.includes("Sin notificaciones");
        const hasItems = $body.find('[id^="notification-read-"]').length > 0;

        expect(hasEmpty || hasItems).to.be.true;
      });
    });

    it("should show empty state when no notifications exist", () => {
      cy.intercept("GET", "**/api/v1/notifications/unread", {
        statusCode: 200,
        body: [],
      }).as("emptyNotifications");

      cy.visit("/owner/dashboard");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.wait("@emptyNotifications");
      
      cy.contains("Sin notificaciones pendientes").should("be.visible");
    });

    it("should show notification items when they exist", () => {
      const mockNotifs = [
        {
          id: "notif-1",
          renterId: "renter-1",
          type: "low_balance",
          payload: {
            message: "Saldo bajo: $10.000",
          },
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-2",
          renterId: "renter-1",
          type: "late_rental",
          payload: {
            message: "Una renta venció.",
          },
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];

      cy.intercept("GET", "**/api/v1/notifications/unread", {
        statusCode: 200,
        body: mockNotifs,
      }).as("mockNotifications");

      cy.visit("/owner/dashboard");
      
      // Esperamos a que el componente cargue los datos mockeados
      cy.wait("@mockNotifications");

      // El badge debe mostrar el conteo
      cy.get('button[id="notification-bell-btn"]').within(() => {
        cy.get("span").contains("2").should("be.visible");
      });

      cy.get('button[id="notification-bell-btn"]').click();

      // El contenido de la notificación debe ser visible
      cy.contains("Saldo bajo").should("be.visible");
      cy.contains("Una renta venció").should("be.visible");
    });

    it("should mark a single notification as read when clicking the X", () => {
      const mockNotif = {
        id: "notif-dismiss",
        renterId: "renter-1",
        type: "feedback_pending",
        payload: { message: "Feedback pendiente de prueba" },
        read: false,
        createdAt: new Date().toISOString(),
      };

      cy.intercept("GET", "**/api/v1/notifications/unread", {
        statusCode: 200,
        body: [mockNotif],
      }).as("mockSingleNotif");

      cy.intercept("PATCH", "**/api/v1/notifications/notif-dismiss/read", {
        statusCode: 200,
        body: { ok: true },
      }).as("markRead");

      cy.visit("/owner/dashboard");
      cy.wait("@mockSingleNotif");

      cy.get('button[id="notification-bell-btn"]').click();

      // Forzamos el click porque el botón solo es visible al hacer hover (CSS group-hover)
      cy.get('button[id="notification-read-notif-dismiss"]').click({ force: true });

      cy.wait("@markRead");
      
      // La notificación debería desaparecer de la lista (el componente la filtra)
      cy.contains("Feedback pendiente de prueba").should("not.exist");
    });

    it("should mark all notifications as read when clicking 'Marcar todas'", () => {
      cy.intercept("GET", "**/api/v1/notifications/unread", {
        statusCode: 200,
        body: [
          {
            id: "notif-a",
            renterId: "renter-1",
            type: "plan_expiring_soon",
            payload: { message: "Plan vence pronto" },
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }).as("mockNotifMarkAll");

      cy.intercept("PATCH", "**/api/v1/notifications/read-all", {
        statusCode: 200,
        body: { ok: true },
      }).as("markAllRead");

      cy.visit("/owner/dashboard");
      cy.wait("@mockNotifMarkAll");

      cy.get('button[id="notification-bell-btn"]').click();
      
      cy.get('button[id="notification-mark-all-read"]').click();

      cy.wait("@markAllRead");
      
      // El dropdown se cierra según el código de NotificationBell.tsx
      cy.get('ul').should("not.exist");
      
      // El badge de la campana debería desaparecer
      cy.get('button[id="notification-bell-btn"]').find("span").should("not.exist");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin RentCheck", () => {
    beforeEach(() => {
      cy.login({ skipRedirect: true });
    });

    it("should display the notification bell in the admin header", () => {
      cy.visit("/adm/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open dropdown and show empty or notifications", () => {
      cy.intercept("GET", "**/api/v1/notifications/unread").as("getAdminNotifications");

      cy.visit("/adm/dashboard");
      cy.wait("@getAdminNotifications");

      cy.get('button[id="notification-bell-btn"]').click();
      
      cy.get("body").then(($body) => {
        const text = $body.text();
        const hasEmpty = text.includes("Sin notificaciones");
        const hasItems = $body.find('[id^="notification-read-"]').length > 0;
        expect(hasEmpty || hasItems).to.be.true;
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Employee
  // ─────────────────────────────────────────────────────────────────────────
  describe("Employee", () => {
    beforeEach(() => {
      cy.login({
        email: ec.email,
        password: ec.password,
        redirectTo: ec.redirectTo,
        skipRedirect: true,
      });
    });

    it("should display the notification bell for employee", () => {
      cy.visit("/employee/dashboard");
      cy.get('button[id="notification-bell-btn"]').should("be.visible");
    });

    it("should open and close the notification dropdown", () => {
      cy.intercept("GET", "**/api/v1/notifications/unread").as("getEmployeeNotifications");
      
      cy.visit("/employee/dashboard");
      cy.wait("@getEmployeeNotifications");

      cy.get('button[id="notification-bell-btn"]').click();
      cy.get("ul").should("be.visible");

      // Cerrar haciendo click fuera (en el main)
      cy.get("main").click({ force: true });
      cy.get("ul").should("not.exist");
    });
  });
});