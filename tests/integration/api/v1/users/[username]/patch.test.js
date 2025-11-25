const { default: password } = require("models/password");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH '/api/v1/users/[username]", () => {
  test("A) With nonexisting 'username'", async () => {
    await orchestrator.createUser();

    const response = await fetch(`http://localhost:3000/api/v1/users/leo09`, {
      method: "PATCH",
      body: JSON.stringify({ username: "leo00" }),
    });

    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      message: "O username informado não foi localizado.",
      action: "Verifique se o username foi digitado corretamente.",
      statusCode: 404,
      name: "NotFoundError",
    });
  });

  test("B) With already existing 'username'", async () => {
    const userB1 = await orchestrator.createUser();

    const userB2 = await orchestrator.createUser();

    const response2 = await fetch(
      `http://localhost:3000/api/v1/users/${userB2.username}`,
      {
        method: "PATCH",
        body: JSON.stringify({ username: userB1.username }),
      },
    );

    const responseBody2 = await response2.json();

    expect(response2.status).toBe(400);
    expect(responseBody2).toEqual({
      message: "O username informado já está em uso.",
      action: "Utilize outro username para realizar a operação.",
      statusCode: 400,
      name: "ValidationError",
    });
  });

  test("C) With already existing 'email'", async () => {
    const userC1 = await orchestrator.createUser();

    const userC2 = await orchestrator.createUser();

    const respC = await fetch(
      `http://localhost:3000/api/v1/users/${userC1.username}`,
      {
        method: "PATCH",
        body: JSON.stringify({ email: userC2.email }),
      },
    );

    const responseBody3 = await respC.json();

    expect(respC.status).toBe(400);

    expect(responseBody3).toEqual({
      message: "O email informado já está em uso.",
      action: "Utilize outro email para realizar a operação.",
      statusCode: 400,
      name: "ValidationError",
    });
  });

  test("D) With unique 'username'", async () => {
    const userD1 = await orchestrator.createUser();

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/${userD1.username}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          username: "changed_username",
        }),
      },
    );

    const respDBody = await respD.json();

    expect(respD.status).toBe(200);
    expect(respDBody).toEqual({
      id: respDBody.id,
      username: "changed_username",
      email: userD1.email,
      password: respDBody.password,
      created_at: respDBody.created_at,
      updated_at: respDBody.updated_at,
    });

    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
  });

  test("E) With unique 'email'", async () => {
    const userE1 = await orchestrator.createUser();

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/${userE1.username}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          email: "unique_email@email.com",
        }),
      },
    );

    const respDBody = await respD.json();

    expect(respD.status).toBe(200);
    expect(respDBody).toEqual({
      id: respDBody.id,
      username: userE1.username,
      email: "unique_email@email.com",
      password: respDBody.password,
      created_at: respDBody.created_at,
      updated_at: respDBody.updated_at,
    });

    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
  });

  test("F) With new 'password'", async () => {
    const userF1 = await orchestrator.createUser();

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/${userF1.username}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          password: "newpassword",
        }),
      },
    );

    const respDBody = await respD.json();

    const correctPasswordMatch = await password.comparePassword(
      "newpassword",
      respDBody.password,
    );

    const incorrectPasswordMatch = await password.comparePassword(
      "validPassword",
      respDBody.password,
    );

    expect(respD.status).toBe(200);
    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
    expect(correctPasswordMatch).toBe(true);
    expect(incorrectPasswordMatch).toBe(false);
  });
});
