const { default: password } = require("models/password");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH '/api/v1/users/[username]", () => {
  describe("with anonymous user", () => {
    test("existing username", async () => {
      const user1 = await orchestrator.createUser({
        username: "existing_username",
      });
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${user1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "updating_username",
          }),
        },
      );

      expect(response.status).toBe(403);

      const response1Body = await response.json();
      expect(response1Body).toEqual({
        action: "Verifique se você possui acesso à feature 'update:user'",
        message: "Você não possui permissão para esta ação.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("Deufault user", () => {
    test("A) With nonexisting 'username'", async () => {
      const userA = await orchestrator.createUser();
      const activatedUserA = await orchestrator.activateUser(userA);
      const sessionUserA = await orchestrator.createSession(activatedUserA.id);

      const response = await fetch(`http://localhost:3000/api/v1/users/leo09`, {
        method: "PATCH",
        body: JSON.stringify({ username: "leo00" }),
        headers: { Cookie: `session_id=${sessionUserA.token}` },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        message: "O username informado não foi localizado.",
        action: "Verifique se o username foi digitado corretamente.",
        statusCode: 404,
        name: "NotFoundError",
      });
    });

    test("B) With duplicated 'username'", async () => {
      const userB1 = await orchestrator.createUser();
      const activatedUserB1 = await orchestrator.activateUser(userB1);
      const sessionUserB1 = await orchestrator.createSession(
        activatedUserB1.id,
      );

      const userB2 = await orchestrator.createUser();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${userB1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ username: userB2.username }),
          headers: { Cookie: `session_id=${sessionUserB1.token}` },
        },
      );

      const responseBody2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(responseBody2).toEqual({
        message: "O username informado já está em uso.",
        action: "Utilize outro username para realizar a operação.",
        statusCode: 400,
        name: "ValidationError",
      });
    });

    test("C) With already existing 'email'", async () => {
      const userC1 = await orchestrator.createUser();
      const activatedUserC1 = await orchestrator.activateUser(userC1);
      const sessionUserC1 = await orchestrator.createSession(
        activatedUserC1.id,
      );

      const userC2 = await orchestrator.createUser();

      const respC = await fetch(
        `http://localhost:3000/api/v1/users/${userC1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ email: userC2.email }),
          headers: { Cookie: `session_id=${sessionUserC1.token}` },
        },
      );

      const responseBody3 = await respC.json();

      expect(respC.status).toBe(400);

      expect(responseBody3).toEqual({
        message: "O email informado já está em uso.",
        action: "Utilize outro email para realizar a operação.",
        statusCode: 400,
        name: "ValidationError",
      });
    });

    test("D) With unique 'username'", async () => {
      const userD1 = await orchestrator.createUser();
      const activatedUserD1 = await orchestrator.activateUser(userD1);
      const sessionUserD1 = await orchestrator.createSession(
        activatedUserD1.id,
      );

      const respD = await fetch(
        `http://localhost:3000/api/v1/users/${userD1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "changed_username",
          }),
          headers: { Cookie: `session_id=${sessionUserD1.token}` },
        },
      );

      const respDBody = await respD.json();

      expect(respD.status).toBe(200);
      expect(respDBody).toEqual({
        id: respDBody.id,
        username: "changed_username",
        email: userD1.email,
        password: respDBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: respDBody.created_at,
        updated_at: respDBody.updated_at,
      });

      expect(respDBody.updated_at > respDBody.created_at).toBe(true);
    });

    test("E) With unique 'email'", async () => {
      const userE1 = await orchestrator.createUser();
      const activatedUserE1 = await orchestrator.activateUser(userE1);
      const sessionUserE1 = await orchestrator.createSession(
        activatedUserE1.id,
      );

      const respD = await fetch(
        `http://localhost:3000/api/v1/users/${userE1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "unique_email@email.com",
          }),
          headers: { Cookie: `session_id=${sessionUserE1.token}` },
        },
      );

      const respDBody = await respD.json();

      expect(respD.status).toBe(200);
      expect(respDBody).toEqual({
        id: respDBody.id,
        username: userE1.username,
        email: "unique_email@email.com",
        password: respDBody.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: respDBody.created_at,
        updated_at: respDBody.updated_at,
      });

      expect(respDBody.updated_at > respDBody.created_at).toBe(true);
    });

    test("F) With new 'password'", async () => {
      const userF1 = await orchestrator.createUser();
      const activatedUserF1 = await orchestrator.activateUser(userF1);
      const sessionUserF1 = await orchestrator.createSession(
        activatedUserF1.id,
      );

      const respD = await fetch(
        `http://localhost:3000/api/v1/users/${userF1.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password: "newpassword",
          }),
          headers: { Cookie: `session_id=${sessionUserF1.token}` },
        },
      );

      const respDBody = await respD.json();

      const correctPasswordMatch = await password.comparePassword(
        "newpassword",
        respDBody.password,
      );

      const incorrectPasswordMatch = await password.comparePassword(
        "validPassword",
        respDBody.password,
      );

      expect(respD.status).toBe(200);
      expect(respDBody.updated_at > respDBody.created_at).toBe(true);
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("G) With UserG targeting userH", async () => {
      const userG = await orchestrator.createUser();
      const activatedUserG = await orchestrator.activateUser(userG);
      const sessionUserG = await orchestrator.createSession(activatedUserG.id);

      const userH = await orchestrator.createUser();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${userH.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ username: "UserZ" }),
          headers: { Cookie: `session_id=${sessionUserG.token}` },
        },
      );

      const responseBody2 = await response2.json();

      expect(response2.status).toBe(403);
      expect(responseBody2).toEqual({
        action:
          "Verifique se você possui as features necessárias para alterar outro usuário.",
        message: "Você não possui autorização para modificar outro usuário.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("Privileged user", () => {
    test("J) With 'update:user:others' targeting defaultUser", async () => {
      const privilegedUser = await orchestrator.createUser();
      const activatedPrivilegedUser =
        await orchestrator.activateUser(privilegedUser);

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      const sessionPrivilegedUser = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({ username: "UpdatedByPrivilegedUser" }),
          headers: { Cookie: `session_id=${sessionPrivilegedUser.token}` },
        },
      );

      const responseBody2 = await response2.json();

      expect(response2.status).toBe(200);

      expect(responseBody2).toEqual({
        id: defaultUser.id,
        username: "UpdatedByPrivilegedUser",
        email: defaultUser.email,
        password: responseBody2.password,
        features: responseBody2.features,
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(responseBody2.updated_at > responseBody2.created_at).toBe(true);
    });
  });
});
