import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("with unique and valid data", async () => {
      const response1 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "leo_gostoso",
          email: "Leo@teste.com",
          password: "senha123",
        }),
      });

      const response1Body = await response1.json();

      expect(response1.status).toBe(201);
      expect(response1Body).toEqual({
        id: response1Body.id,
        username: "leo_gostoso",
        email: "Leo@teste.com",
        password: "senha123",
        created_at: response1Body.created_at,
        updated_at: response1Body.updated_at,
      });

      expect(uuidVersion(response1Body.id)).toBe(4);

      expect(Date.parse(response1Body.created_at)).not.toBeNaN();
      expect(Date.parse(response1Body.updated_at)).not.toBeNaN();
    });

    test("with duplicated email", async () => {
      const response2 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "leo_lindao",
          email: "leo@teste.com",
          password: "senha123",
        }),
      });

      const response2Body = await response2.json();

      expect(response2.status).toBe(400);
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já consta na base de dados.",
        action: "Utilize outro email.",
        statusCode: 400,
      });
    });

    test("with duplicated username", async () => {
      const response3 = await fetch(`http://localhost:3000/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "leo_gostoso",
          email: "leo2@teste.com",
          password: "senha123",
        }),
      });

      const response3Body = await response3.json();

      expect(response3.status).toBe(400);
      expect(response3Body).toEqual({
        name: "ValidationError",
        message: "O username já está em uso.",
        action: "Por favor, tente outro username.",
        statusCode: 400,
      });
    });
  });
});
