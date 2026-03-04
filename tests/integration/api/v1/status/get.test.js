import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("retrieving current system status", async () => {
      const response = await fetch(`http://localhost:3000/api/v1/status`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const receivedDate = new Date(responseBody.updated_at).toISOString();

      expect(responseBody.updated_at).toEqual(receivedDate);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThan(0);
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const user2 = await orchestrator.createUser();
      const activatedUser2 = await orchestrator.activateUser(user2);
      await orchestrator.addFeaturesToUser(user2, ["read:status:all"]);
      const sessionUser2 = await orchestrator.createSession(activatedUser2.id);

      const response2 = await fetch(`http://localhost:3000/api/v1/status`, {
        headers: { Cookie: `session_id=${sessionUser2.token}` },
      });

      expect(response2.status).toBe(200);

      const response2body = await response2.json();
      const parsedUpdatedAt = new Date(response2body.updated_at).toISOString();
      expect(response2body.updated_at).toEqual(parsedUpdatedAt);
      expect(response2body.dependencies.database.version).toEqual("16.10");
      expect(response2body.dependencies.database.max_connections).toEqual(100);
      expect(response2body.dependencies.database.opened_connections).toEqual(1);
    });
  });
});
