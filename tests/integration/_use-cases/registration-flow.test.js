const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow (all successful)", () => {
  test("A) Create user account", async () => {
    const userA = await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "userA@email.com",
        username: "userA",
        password: "userA",
      }),
    });

    const userABody = await userA.json();

    expect(userA.status).toBe(201);
    expect(userABody).toEqual({
      id: userABody.id,
      username: "userA",
      email: "userA@email.com",
      password: userABody.password,
      features: ["read:activation_token"],
      created_at: userABody.created_at,
      updated_at: userABody.updated_at,
    });
  });

  test("B) Receive activation email", async () => {});

  test("C) Activate account", async () => {});

  test("D) Login", async () => {});

  test("E) Get user informations", async () => {});
});
