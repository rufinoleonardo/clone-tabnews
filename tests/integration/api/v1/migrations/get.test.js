const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("1) Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch(`http://localhost:3000/api/v1/migrations`);
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se você possui acesso à feature 'read:migration'",
        message: "Você não possui permissão para esta ação.",
        name: "ForbiddenError",
        statusCode: 403,
      });

      // expect(Array.isArray(responseBody)).toBe(true);
    });
  });

  describe("2) Default user", () => {
    test("A) Retrieving pending migrations", async () => {
      const userA = await orchestrator.createUser();
      const activatedUserA = await orchestrator.activateUser(userA);
      const sessionUserA = await orchestrator.createSession(activatedUserA.id);

      const responseA = await fetch(`http://localhost:3000/api/v1/migrations`, {
        headers: { Cookie: `session_id=${sessionUserA.token}` },
      });

      expect(responseA.status).toBe(403);

      const responseABody = await responseA.json();
      expect(responseABody).toEqual({
        action: "Verifique se você possui acesso à feature 'read:migration'",
        message: "Você não possui permissão para esta ação.",
        name: "ForbiddenError",
        statusCode: 403,
      });
    });
  });

  describe("3) Privileged user", () => {
    test("A) With `read:migration`", async () => {
      const user3a = await orchestrator.createUser();
      const activatedUser3a = await orchestrator.activateUser(user3a);
      await orchestrator.addFeaturesToUser(user3a, ["read:migration"]);
      const sessionUser3a = await orchestrator.createSession(
        activatedUser3a.id,
      );

      const response3 = await fetch(`http://localhost:3000/api/v1/migrations`, {
        headers: { Cookie: `session_id=${sessionUser3a.token}` },
      });

      expect(response3.status).toBe(200);

      const response3body = await response3.json();
      expect(Array.isArray(response3body)).toBe(true);
    });
  });
});
