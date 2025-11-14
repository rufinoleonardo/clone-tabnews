const { default: orchestrator } = require("tests/orchestrator");
import session from "models/session";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("anonymous user", () => {
    test("A) With incorrect email but correct password", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const responseA = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "incorrect_email@email.com",
          password: "senha-correta",
        }),
      });

      const respABody = await responseA.json();

      expect(responseA.status).toBe(401);
      expect(respABody).toEqual({
        name: "AuthenticationError",
        message: "Dados não conferem com a base de dados.",
        action: "Verifique os dados e reenvie o formulário.",
        statusCode: 401,
      });
    });

    test("B) With correct email but incorrect password", async () => {
      await orchestrator.createUser({
        email: "email_correto@email.com",
        password: "senha-correta",
      });

      const responseA = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "email_correto@email.com",
          password: "senha-errada",
        }),
      });

      const respABody = await responseA.json();

      expect(responseA.status).toBe(401);
      expect(respABody).toEqual({
        name: "AuthenticationError",
        message: "Dados não conferem com a base de dados.",
        action: "Verifique os dados e reenvie o formulário.",
        statusCode: 401,
      });
    });

    test("C) With incorrect email and password", async () => {
      await orchestrator.createUser({
        email: "email_correto_C@email.com",
        password: "senha-correta",
      });

      const responseA = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "email_incorreto@email.com",
          password: "senha-errada",
        }),
      });

      const respABody = await responseA.json();

      expect(responseA.status).toBe(401);
      expect(respABody).toEqual({
        name: "AuthenticationError",
        message: "Dados não conferem com a base de dados.",
        action: "Verifique os dados e reenvie o formulário.",
        statusCode: 401,
      });
    });

    test("D) With correct email and password", async () => {
      await orchestrator.createUser({
        username: "userD",
        email: "user_d@email.com",
        password: "correct_password",
      });

      const responseD = await fetch(`http://localhost:3000/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user_d@email.com",
          password: "correct_password",
        }),
      });

      const responseDBody = await responseD.json();

      expect(responseD.status).toBe(201);

      expect(responseDBody).toEqual({
        id: responseDBody.id,
        user_id: responseDBody.user_id,
        token: responseDBody.token,
        expires_at: responseDBody.expires_at,
        created_at: responseDBody.created_at,
        updated_at: responseDBody.updated_at,
      });

      expect(uuidVersion(responseDBody.id)).toBe(4);
      expect(Date.parse(responseDBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseDBody.updated_at)).not.toBeNaN();

      const createdAt = new Date(responseDBody.created_at);
      const expiresAt = new Date(responseDBody.expires_at);

      createdAt.setMilliseconds(0);
      expiresAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(responseD, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: responseDBody.token,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
