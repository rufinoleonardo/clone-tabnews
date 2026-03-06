const { default: orchestrator } = require("tests/orchestrator");
import activation from "models/activation";
import user from "models/user";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[tokenId]", () => {
  describe("Anonymous user", () => {
    test("A) with nonexistent token", async () => {
      const nonExistentToken = "16228c8c-7c91-4cdb-ba3f-783e3fe29b34";

      const responseA = await fetch(
        `http://localhost:3000/api/v1/activations/${nonExistentToken}`,
        {
          method: "PATCH",
        },
      );

      expect(responseA.status).toBe(404);
    });

    test("B) with expired token", async () => {
      jest.useFakeTimers({
        now: Date.now() - activation.EXPIRATION_IN_MILLISECONDS,
      });

      const userB = await orchestrator.createUser({
        username: "userB",
        email: "userB@email.com",
        password: "userB",
      });

      const activationTokenB = await activation.create(userB.id);

      jest.useRealTimers();

      const responseB = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenB.id}`,
        {
          method: "PATCH",
        },
      );

      expect(responseB.status).toBe(404);

      const responseBBody = await responseB.json();
      expect(responseBBody).toEqual({
        action: "Entre em contato com o suporte",
        message: "Token inválido.",
        name: "NotFoundError",
        statusCode: 404,
      });

      //jest.useFakeTimers
      // create user
      // jest.useREalTimers()
    });

    test("C) with already used token", async () => {
      const userC = await orchestrator.createUser({
        username: "userC",
        email: "userC@email.com",
        password: "userC",
      });

      const activationTokenC = await activation.create(userC.id);

      const responseC = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenC.id}`,
        {
          method: "PATCH",
        },
      );

      expect(responseC.status).toBe(200);

      const responseC2 = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenC.id}`,
        {
          method: "PATCH",
        },
      );

      expect(responseC2.status).toBe(404);

      const responseC2Body = await responseC2.json();
      expect(responseC2Body).toEqual({
        action: "Entre em contato com o suporte",
        message: "Token inválido.",
        name: "NotFoundError",
        statusCode: 404,
      });
    });

    test("D) with valid token", async () => {
      const userD = await orchestrator.createUser({
        username: "userD",
        email: "userD@email.com",
        password: "userD",
      });

      const activationTokenD = await activation.create(userD.id);

      const responseD = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenD.id}`,
        {
          method: "PATCH",
        },
      );

      expect(responseD.status).toBe(200);

      const responseDBody = await responseD.json();
      expect(responseDBody).toEqual({
        created_at: responseDBody.created_at,
        expires_at: responseDBody.expires_at,
        id: responseDBody.id,
        updated_at: responseDBody.updated_at,
        used_at: responseDBody.used_at,
        user_id: userD.id,
      });

      expect(responseDBody.created_at < responseDBody.expires_at).toBe(true);
      expect(Date.parse(responseDBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseDBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseDBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseDBody.used_at)).not.toBeNaN();
      expect(uuidVersion(responseDBody.id)).toBe(4);
      expect(responseDBody.used_at < responseDBody.expires_at).toBe(true);

      const activatedUserD = await user.findOneById(responseDBody.user_id);

      expect(activatedUserD.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
      ]);
    });

    test("E) with valid token but already activated user", async () => {
      const userE = await orchestrator.createUser({
        username: "userE",
        email: "userE@email.com",
        password: "userE",
      });

      await orchestrator.activateUser(userE);
      const activationTokenE = await activation.create(userE.id);

      const responseE = await fetch(
        `http://localhost:3000/api/v1/activations/${activationTokenE.id}`,
        {
          method: "PATCH",
        },
      );

      expect(responseE.status).toBe(403);
      const resposeEBody = await responseE.json();
      expect(resposeEBody).toEqual({
        action: "Caso acredite seja um engano, contatar o suporte",
        message: "Você não pode mais utilizar tokens de ativação.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("Default user", () => {
    test("A) with valid token, but already logged in user", async () => {
      const userA = await orchestrator.createUser({
        username: "userA",
        password: "userA",
        email: "userA@email.com",
      });
      await orchestrator.activateUser(userA);
      const userASession = await orchestrator.createSession(userA.id);

      const userA2 = await orchestrator.createUser({
        username: "userA2",
        email: "userA2@email.com",
        password: "userA2",
      });
      const userA2ActivationToken = await activation.create(userA2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${userA2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${userASession.token}`,
          },
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
