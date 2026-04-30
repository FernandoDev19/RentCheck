/**
 * 05-employees.cy.ts
 *
 * This spec covers the Employees module:
 *   - Page structure (title, table, create button)
 *   - Validation errors on empty form submit
 *   - Create employee (Owner role → must pick a branch)
 *   - Search an employee by name/email
 *   - Edit employee details
 *   - Delete employee with confirmation dialog
 *   - Role restrictions: Admin can NOT see employee management actions
 *
 * Roles tested:
 *   - Owner  (/owner/employees)
 */

type EmployeeFixture = {
    name: string;
    email: string;
    password: string;
    identityType: string;
    identityNumber: string;
};

describe("Employees", () => {
    let employee: EmployeeFixture;
    let createdEmployeeId: string;

    const rc = Cypress.env("RENTER_CREDENTIALS");

    before(() => {
        cy.task("db:reset");
        cy.fixture("employee").then((data) => {
            employee = data;
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Owner — /owner/employees
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

        it("should display the employees page with correct structure", () => {
            cy.visit("/owner/employees");

            cy.contains("Gestión de empleados").should("be.visible");
            cy.contains("Gestiona los empleados de la empresa").should("be.visible");

            cy.get('input[id="search"]').should("be.visible");
            cy.get('button[id="create-button"]').should("be.visible");
            cy.get("table").should("be.visible");
        });

        it("should show validation errors when creating an employee with empty fields", () => {
            cy.visit("/owner/employees");

            cy.get('button[id="create-button"]').click();

            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Crear nuevo empleado").should("be.visible");

            // Submit without filling anything
            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait(500);

            cy.contains("Revisa los campos marcados en rojo").should("be.visible");
        });

        it("should create a new employee", () => {
            cy.intercept("POST", "**/api/v1/employees").as("createEmployee");

            cy.visit("/owner/employees");

            cy.get('button[id="create-button"]').click();

            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Crear nuevo empleado").should("be.visible");

            // Fill in form
            cy.get('input[id="swal-name"]').type(employee.name);
            cy.get('input[id="swal-email"]').type(employee.email);
            cy.get('input[id="swal-password"]').type(employee.password);
            cy.get('input[id="swal-identity-number"]').type(employee.identityNumber);

            // Owner role: must pick a branch via PaginatedSelect
            // The PaginatedSelect renders a hidden input with the selected value.
            // We open the dropdown, wait for options to load, and pick the first.
            cy.get('div[id="swal-branch"]').should("exist").click();
            cy.wait(500);
            cy.get('[id="swal-branch"] li').first().click({ force: true });

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@createEmployee").then((interception) => {
                expect(interception.response!.statusCode).to.eq(201);
                createdEmployeeId = interception.response!.body.id;
            });

            cy.wait(1500);
            cy.contains("El empleado ha sido creado correctamente").should("be.visible");
        });

        it("should search for the created employee", () => {
            cy.visit("/owner/employees");

            cy.get('input[id="search"]').type(employee.name);

            cy.wait(1000);

            cy.contains(employee.name).should("be.visible");
        });

        it("should edit the employee", () => {
            cy.intercept("PUT", "**/api/v1/employees/*").as("updateEmployee");

            cy.visit("/owner/employees");

            cy.get('input[id="search"]').type(employee.name);
            cy.wait(1000);

            // Click the edit button (green button)
            cy.get("table tbody tr").first().within(() => {
                cy.get('button[color="green"]').first().click({ force: true });
            });

            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("Editar empleado").should("be.visible");

            cy.get('input[id="swal-name"]').clear().type("Editado " + employee.name);
            cy.get('input[id="swal-email"]').clear().type("editado-" + employee.email);

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@updateEmployee").then((interception) => {
                expect(interception.response!.statusCode).to.be.oneOf([200, 201]);
            });

            cy.wait(1500);
            cy.contains("El empleado ha sido editado correctamente").should("be.visible");
        });

        it("should delete the employee", () => {
            cy.intercept("DELETE", "**/api/v1/employees/*").as("deleteEmployee");

            cy.visit("/owner/employees");

            cy.get('input[id="search"]').type("Editado " + employee.name);
            cy.wait(1000);

            // Click the delete button (red button)
            cy.get("table tbody tr").first().within(() => {
                cy.get('button[color="red"]').first().click({ force: true });
            });

            cy.wait(500);

            cy.get('div[class*="swal2-container"]').should("be.visible");
            cy.contains("¿Eliminar Empleado?").should("be.visible");
            cy.contains("¿Estás seguro de que quieres eliminar a este Empleado?").should("be.visible");

            cy.get('button[class="swal2-confirm swal2-styled"]').click();

            cy.wait("@deleteEmployee").then((interception) => {
                expect(interception.response!.statusCode).to.eq(200);
            });

            cy.wait(1500);
            cy.contains("Empleado eliminado correctamente").should("be.visible");

            cy.task("db:reset");
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Admin RentCheck — can see employees but cannot manage them
    // ─────────────────────────────────────────────────────────────────────────
    describe("Admin RentCheck", () => {
        beforeEach(() => {
            cy.login();
        });

        it("should NOT have access to /owner/employees", () => {
            cy.visit("/owner/employees");
            cy.url().should("include", "/unauthorized");
        });

        it("should NOT show a create button on /adm/employees", () => {
            cy.visit("/adm/employees");
            cy.get('button[id="create-button"]').should("not.exist");
        });
    });
});
