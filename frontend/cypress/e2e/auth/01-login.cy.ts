type UsersFixture = {
  admin: {
    name: string;
    renterId: string | null;
    employeeId: string | null;
    branchId: string | null;
    roleId: number;
    status: string;
  };
  invalidUser: {
    name: string;
    email: string;
    password: string;
    renterId: string | null;
    employeeId: string | null;
    branchId: string | null;
    roleId: number;
    status: string;
  };
};

describe("Login", () => {
  let users: UsersFixture;
  let urlBase: string;

  before(() => {
    cy.env<{ apiUrl: string }>(["apiUrl"]).then((v) => {
      urlBase = `${v.apiUrl}/auth/login`;
    });
    cy.fixture("users").then((data) => {
      users = data;
    });
  });

  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit("/login");
  });

  after(() => {
    cy.clearAllLocalStorage();
    cy.visit("/login");
  });

  it("Should login page have email, password fields and action button", () => {
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.get('button[type="submit"]').should("exist");
  });

  it("Should render errors when empty fields", () => {
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid email address").should("exist");
    cy.contains("Too small: expected string to have >=6 characters").should(
      "exist",
    );
    cy.url().should("include", "/login");
  });

  it("Should render error when invalid credentials", () => {
    cy.intercept("POST", urlBase).as("login");

    cy.get('input[type="email"]').type(users.invalidUser.email);
    cy.get('input[type="password"]').type(users.invalidUser.password);
    cy.get('button[type="submit"]').click();

    cy.wait("@login").its("response.statusCode").should("eq", 404);

    cy.contains("Error de inicio de sesión").should("be.visible");
    cy.contains("User not found").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("Should render error when invalid password", () => {
    cy.intercept("POST", urlBase).as("login2");

    cy.env<{ ADMIN_EMAIL: string }>(["ADMIN_EMAIL"]).then((v) => {
      cy.get('input[type="email"]').type(v.ADMIN_EMAIL);
    });

    cy.get('input[type="password"]').type(users.invalidUser.password);
    cy.get('button[type="submit"]').click();

    cy.wait("@login2").then((interception) => {
      expect(interception.response.statusCode).to.eq(401);
      cy.contains("Error de inicio de sesión").should("be.visible");
      cy.contains("Contraseña incorrecta").should("be.visible");
      cy.url().should("include", "/login");
    });
  });

  it("Should allow access to Dashboard when admin valid credentials", () => {
    cy.env<{ ADMIN_EMAIL: string; ADMIN_PASSWORD: string }>([
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ]).then((v) => {
      cy.get('input[type="email"]').type(v.ADMIN_EMAIL);
      cy.get('input[type="password"]').type(v.ADMIN_PASSWORD);
    });

    cy.get('button[type="submit"]').click();

    cy.contains("¡Bienvenido!").should("exist");
    cy.contains("Inicio de sesión exitoso").should("exist");

    cy.url().should("include", "/adm/dashboard");
  });

  it("Should allow access to Dashboard when Owner valid credentials", () => {
    cy.env<{
      RENTER_CREDENTIALS: {
        email: string;
        password: string;
        redirectTo: string;
      };
    }>(["RENTER_CREDENTIALS"]).then((v) => {
      cy.get('input[type="email"]').type(v.RENTER_CREDENTIALS.email);
      cy.get('input[type="password"]').type(v.RENTER_CREDENTIALS.password);
    });

    cy.get('button[type="submit"]').click();

    cy.contains("¡Bienvenido!").should("exist");
    cy.contains("Inicio de sesión exitoso").should("exist");

    cy.url().should("include", "/owner/dashboard");
  });

  it("Should allow access to Dashboard when Manager valid credentials", () => {
    cy.env<{
      MANAGER_CREDENTIALS: {
        email: string;
        password: string;
        redirectTo: string;
      };
    }>(["MANAGER_CREDENTIALS"]).then((v) => {
      cy.get('input[type="email"]').type(v.MANAGER_CREDENTIALS.email);
      cy.get('input[type="password"]').type(v.MANAGER_CREDENTIALS.password);
    });

    cy.get('button[type="submit"]').click();

    cy.contains("¡Bienvenido!").should("exist");
    cy.contains("Inicio de sesión exitoso").should("exist");

    cy.url().should("include", "/manager/dashboard");
  });

    it("Should allow access to Dashboard when Employee valid credentials", () => {
    cy.env<{
      EMPLOYEE_CREDENTIALS: {
        email: string;
        password: string;
        redirectTo: string;
      };
    }>(["EMPLOYEE_CREDENTIALS"]).then((v) => {
      cy.get('input[type="email"]').type(v.EMPLOYEE_CREDENTIALS.email);
      cy.get('input[type="password"]').type(v.EMPLOYEE_CREDENTIALS.password);
    });

    cy.get('button[type="submit"]').click();

    cy.contains("¡Bienvenido!").should("exist");
    cy.contains("Inicio de sesión exitoso").should("exist");

    cy.url().should("include", "/employee/dashboard");
  });

});
