const { default: orchestrator } = require("tests/orchestrator");
import { version as uuidVersion } from "uuid";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/sessions", () => {
  describe("Default user", () => {
    test("A) with valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "valid_session",
        password: "valid_session",
        email: "valid_session@email.com",
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const responseA = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: { Cookie: `session_id=${createdSession.token}` },
      });

      const responseABody = await responseA.json();

      expect(responseA.status).toBe(200);
      expect(responseABody).toEqual({
        id: createdUser.id,
        username: "valid_session",
        email: "valid_session@email.com",
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseABody.id)).toBe(4);
      expect(Date.parse(responseABody.created_at)).not.toBeNaN();
      expect(Date.parse(responseABody.updated_at)).not.toBeNaN();

      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSessionObject.expires_at > createdSession.expires_at).toBe(
        true,
      );

      const parsedSetCookie = setCookieParser(responseA, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });

      const cacheControl = responseA.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );
    });

    test("B) with nonexistent session", async () => {
      const nonexistentToken =
        "2f724c4e57b35ac251b24e04334be8c49993c1cdf442852871a4a0ab011ab4170774e2d7160628cafa93baf24ebec99c";

      const responseB = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: { Cookie: `session_id=${nonexistentToken}` },
      });

      const responseBBody = await responseB.json();

      expect(responseB.status).toBe(401);
      expect(responseBBody).toEqual({
        name: "AuthenticationError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se o usuário está logado e tente novamente",
        statusCode: 401,
      });
    });

    test("C) with expired session", async () => {
      jest.useFakeTimers({
        now: Date.now() - session.EXPIRATION_IN_MILLISECONDS,
      });

      const userC = await orchestrator.createUser({
        username: "userWithExpiredSession",
      });

      const sessionC = await orchestrator.createSession(userC.id);

      jest.useRealTimers();

      const responseC = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: { Cookie: `session_id=${sessionC.token}` },
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

    test("D) with valid session and smaller time to expiration", async () => {
      const HALF_MONTH_IN_MILLISSECONDS = 1000 * 60 * 60 * 24 * 15;
      jest.useFakeTimers({
        now: new Date(Date.now() - HALF_MONTH_IN_MILLISSECONDS),
      });

      const userD = await orchestrator.createUser({
        username: "userDWithValidSession",
      });

      const sessionD = await orchestrator.createSession(userD.id);

      jest.useRealTimers();

      const responseD = await fetch(`http://localhost:3000/api/v1/user`, {
        headers: { Cookie: `session_id=${sessionD.token}` },
      });

      expect(responseD.status).toBe(200);

      expect(sessionD).toEqual({
        id: sessionD.id,
        token: sessionD.token,
        user_id: userD.id,
        expires_at: sessionD.expires_at,
        created_at: sessionD.created_at,
        updated_at: sessionD.updated_at,
      });
      expect(uuidVersion(sessionD.id)).toBe(4);
      expect(Date.parse(sessionD.created_at)).not.toBeNaN();
      expect(Date.parse(sessionD.expires_at)).not.toBeNaN();
      expect(Date.parse(sessionD.updated_at)).not.toBeNaN();

      // COOKIE ASSERTIONS
      const parsedSetCookieD = setCookieParser(responseD, {
        map: true,
      });

      expect(parsedSetCookieD.session_id).toEqual({
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        name: "session_id",
        path: "/",
        value: sessionD.token,
      });

      // * RENEWED SESSION ASSERTIONS

      const renewedSessionD = await session.findOneValidById(sessionD.id);

      expect(renewedSessionD.expires_at > sessionD.expires_at).toBe(true);
      expect(renewedSessionD.updated_at > sessionD.updated_at).toBe(true);
    });
  });
});
