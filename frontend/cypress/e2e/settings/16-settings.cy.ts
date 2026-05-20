/**
 * 16-settings.cy.ts
 *
 * Covers the Settings page for each role:
 *   - Admin
 *   - Owner
 *   - Manager
 *   - Employee
 * 
 * Verifies Profile, Password Change, and Session Management.
 */

describe("Settings", () => {
  const rc = Cypress.env("RENTER_CREDENTIALS");
  const mc = Cypress.env("MANAGER_CREDENTIALS");
  const ec = Cypress.env("EMPLOYEE_CREDENTIALS");
  const ac = { email: Cypress.env("ADMIN_EMAIL"), password: Cypress.env("ADMIN_PASSWORD"), redirectTo: "/adm/dashboard" };

  const roles = [
    { name: "Admin", credentials: ac, basePath: "/adm/settings" },
    { name: "Owner", credentials: rc, basePath: "/owner/settings" },
    { name: "Manager", credentials: mc, basePath: "/manager/settings" },
    { name: "Employee", credentials: ec, basePath: "/employee/settings" },
  ];

  roles.forEach((role) => {
    describe(`${role.name} Settings`, () => {
      beforeEach(() => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.clearAllSessionStorage();

        cy.login({
          email: role.credentials.email,
          password: role.credentials.password,
          redirectTo: role.credentials.redirectTo,
        });
        
        // Navigate to settings via header or directly
        cy.visit(role.basePath);
      });

      it("debe navegar a configuración y mostrar los datos del perfil", () => {
        cy.url().should("include", "/settings");
        cy.contains("h1", "Configuración").should("be.visible");
        cy.get("#settings-email").should("have.value", role.credentials.email);
      });

      it("debe mostrar validación al intentar guardar un perfil inválido", () => {
        cy.get("#settings-name").clear().type("A");
        cy.contains("button", "Guardar cambios").click();
        cy.contains("El nombre debe tener al menos 3 caracteres").should("be.visible");

        cy.get("#settings-name").clear().type("Nuevo Nombre");
        cy.get("#settings-email").clear().type("correo@invalido");
        cy.contains("button", "Guardar cambios").click();
        cy.contains("Ingresa un correo válido").should("be.visible");
      });

      it("debe actualizar el perfil correctamente", () => {
        cy.intercept("PUT", "**/auth/profile", {
          statusCode: 200,
          body: { message: "Perfil actualizado correctamente" },
        }).as("updateProfileStubbed");

        const newName = `${role.name} Modificado ${Date.now().toString().slice(-4)}`;
        cy.get("#settings-name").clear().type(newName);
        
        cy.contains("button", "Guardar cambios").click();
        cy.wait("@updateProfileStubbed").its("request.body").should("deep.include", {
          name: newName,
          email: role.credentials.email
        });

        cy.contains("Perfil actualizado correctamente").should("be.visible");
      });

      it("debe mostrar validaciones al cambiar contraseña", () => {
        cy.contains("button", "Seguridad").click();
        
        cy.contains("button", "Cambiar contraseña").click();
        cy.contains("Ingresa tu contraseña actual").should("be.visible");
        cy.contains("La nueva contraseña debe tener al menos 8 caracteres").should("be.visible");

        cy.get("#settings-current-pw").type(role.credentials.password);
        cy.get("#settings-new-pw").type("pass");
        cy.contains("button", "Cambiar contraseña").click();
        cy.contains("La nueva contraseña debe tener al menos 8 caracteres").should("be.visible");

        cy.get("#settings-new-pw").clear().type("newpassword123");
        cy.get("#settings-confirm-pw").type("different123");
        cy.contains("button", "Cambiar contraseña").click();
        cy.contains("Las contraseñas no coinciden").should("be.visible");
      });

      // La zona peligrosa solo se muestra en la pestaña 'profile'
      it("debe cerrar sesión localmente al pulsar Cerrar Sesiones (solo Profile tab)", () => {
        cy.contains("button", "Perfil").click();
        
        cy.contains("button", "Cerrar todas las sesiones").click();
        cy.contains("¿Cerrar todas las sesiones?").should("be.visible");
        
        cy.intercept("POST", "**/auth/logout", { statusCode: 200 }).as("logoutStub");
        cy.contains("button", "Sí, cerrar sesiones").click();
        cy.wait("@logoutStub");
        
        cy.url().should("include", "/login");
      });
    });
  });
});
