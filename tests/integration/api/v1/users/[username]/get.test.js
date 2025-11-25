const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET '/api/v1/users/[username]", () => {
  test("With exact matchcase", async () => {
    const user1 = await orchestrator.createUser({
      username: "leo_gateenho",
    });

    const response = await fetch(
      "http://localhost:3000/api/v1/users/leo_gateenho",
    );

    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "leo_gateenho",
      email: `${user1.email}`,
      password: responseBody.password,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("With case missmatch", async () => {
    const user2 = await orchestrator.createUser({
      username: "leo_maromba",
    });

    const response = await fetch(
      "http://localhost:3000/api/v1/users/Leo_maromba",
    );

    const responseBody2 = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody2).toEqual({
      id: responseBody2.id,
      username: "leo_maromba",
      email: `${user2.email}`,
      password: responseBody2.password,
      created_at: responseBody2.created_at,
      updated_at: responseBody2.updated_at,
    });
  });

  test("With nonexistent username", async () => {
    await orchestrator.createUser();

    const response3 = await fetch(
      "http://localhost:3000/api/v1/users/higher_me",
    );

    const responseBody3 = await response3.json();

    expect(response3.status).toBe(404);
    expect(responseBody3).toEqual({
      name: "NotFoundError",
      message: "O username informado não foi localizado.",
      action: "Verifique se o username foi digitado corretamente.",
      statusCode: 404,
    });
  });
});
