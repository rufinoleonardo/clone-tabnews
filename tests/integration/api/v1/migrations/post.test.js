import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running pending migrations", async () => {
      const response1 = await fetch(`http://localhost:3000/api/v1/migrations`, {
        method: "POST",
      });

      const response1Body = await response1.json();

      expect(response1.status).toBe(403);
      expect(response1Body).toEqual({
        action: "Verifique se você possui acesso à feature 'create:migration'",
        message: "Você não possui permissão para esta ação.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Running pending migrations", async () => {
      const user2 = await orchestrator.createUser();
      const activatedUser2 = await orchestrator.activateUser(user2);
      const sessionUser2 = await orchestrator.createSession(activatedUser2.id);

      const response1 = await fetch(`http://localhost:3000/api/v1/migrations`, {
        method: "POST",
        headers: { Cookie: `session_id=${sessionUser2.token}` },
      });

      const response1Body = await response1.json();

      expect(response1.status).toBe(403);
      expect(response1Body).toEqual({
        action: "Verifique se você possui acesso à feature 'create:migration'",
        message: "Você não possui permissão para esta ação.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("Previleged user", () => {
    test("Running pending migrations", async () => {
      const user3 = await orchestrator.createUser();
      const activatedUser3 = await orchestrator.activateUser(user3);
      await orchestrator.addFeaturesToUser(user3, ["create:migration"]);
      const sessionUser3 = await orchestrator.createSession(activatedUser3.id);

      const response1 = await fetch(`http://localhost:3000/api/v1/migrations`, {
        method: "POST",
        headers: { Cookie: `session_id=${sessionUser3.token}` },
      });

      const response1Body = await response1.json();

      expect(response1.status).toBe(200);
      expect(Array.isArray(response1Body)).toBe(true);
    });
  });
});
