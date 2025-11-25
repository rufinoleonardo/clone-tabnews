const { default: orchestrator } = require("tests/orchestrator");
import session from "models/session";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("anonymous user", () => {
    test("A) with nonexistent session", async () => {
      const nonexistentToken =
        "2f724c4e57b35ac251b24e04334be8c49993c1cdf442852871a4a0ab011ab4170774e2d7160628cafa93baf24ebec99c";

      const responseA = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: { Cookie: `session_id=${nonexistentToken}` },
      });

      const responseABody = await responseA.json();

      expect(responseA.status).toBe(401);
      expect(responseABody).toEqual({
        name: "AuthenticationError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente",
        statusCode: 401,
      });
    });

    test("B) with expired session", async () => {
      jest.useFakeTimers({
        now: Date.now() - session.EXPIRATION_IN_MILLISECONDS,
      });

      const userB = await orchestrator.createUser({
        username: "userWithExpiredSession",
      });

      const sessionB = await orchestrator.createSession(userB.id);

      jest.useRealTimers();

      const responseC = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: { Cookie: `session_id=${sessionB.token}` },
      });

      const responseCBody = await responseC.json();

      expect(responseC.status).toBe(401);
      expect(responseCBody).toEqual({
        name: "AuthenticationError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente",
        statusCode: 401,
      });
    });

    test("C) with valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "valid_session",
        password: "valid_session",
        email: "valid_session@email.com",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const responseC = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "DELETE",
        headers: { Cookie: `session_id=${createdSession.token}` },
      });

      const responseCBody = await responseC.json();

      expect(responseC.status).toBe(200);
      expect(responseCBody).toEqual({
        id: responseCBody.id,
        user_id: createdUser.id,
        token: responseCBody.token,
        expires_at: responseCBody.expires_at,
        created_at: responseCBody.created_at,
        updated_at: responseCBody.updated_at,
      });

      expect(uuidVersion(responseCBody.id)).toBe(4);
      expect(Date.parse(responseCBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseCBody.updated_at)).not.toBeNaN();

      expect(
        responseCBody.expires_at < createdSession.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseCBody.updated_at > createdSession.updated_at.toISOString(),
      ).toBe(true);

      const parsedSetCookie = setCookieParser(responseC, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Doubled check assertions
      const doubleCheckResponse = await fetch(
        `http://localhost:3000/api/v1/user`,
        {
          headers: {
            Cookies: `session_id=${createdSession.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doubleCheckResponse.json();

      expect(doubleCheckResponseBody).toEqual({
        name: "AuthenticationError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente",
        statusCode: 401,
      });
    });
  });
});
