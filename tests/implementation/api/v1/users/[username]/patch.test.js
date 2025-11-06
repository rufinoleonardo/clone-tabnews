const { default: password } = require("models/password");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH '/api/v1/users/[username]", () => {
  test("With nonexisting 'username'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "leo00",
        email: `leo00@email.com`,
        password: "121212",
      }),
    });

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

  test("With already existing 'username'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "leo02",
        email: `leo02@email.com`,
        password: "332233",
      }),
    });

    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "leo03",
        email: `leo03@email.com`,
        password: "332233",
      }),
    });

    const response2 = await fetch(`http://localhost:3000/api/v1/users/leo02`, {
      method: "PATCH",
      body: JSON.stringify({ username: "leo03" }),
    });

    const responseBody2 = await response2.json();

    expect(response2.status).toBe(400);
    expect(responseBody2).toEqual({
      message: "O username informado já está em uso.",
      action: "Utilize outro username para realizar a operação.",
      statusCode: 400,
      name: "ValidationError",
    });
  });

  test("With already existing 'email'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "leo04",
        email: `leo04@email.com`,
        password: "332233",
      }),
    });

    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "leo05",
        email: `leo05@email.com`,
        password: "332233",
      }),
    });

    const respC = await fetch(`http://localhost:3000/api/v1/users/leo04`, {
      method: "PATCH",
      body: JSON.stringify({ email: "leo05@email.com" }),
    });

    const responseBody3 = await respC.json();

    expect(respC.status).toBe(400);

    expect(responseBody3).toEqual({
      message: "O email informado já está em uso.",
      action: "Utilize outro email para realizar a operação.",
      statusCode: 400,
      name: "ValidationError",
    });
  });

  test("With unique 'username'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "unique_username",
        email: "uniqueusername@email.com",
        password: "uniqueUsername",
      }),
    });

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/unique_username`,
      {
        method: "PATCH",
        body: JSON.stringify({
          username: "unique_username2",
        }),
      },
    );

    const respDBody = await respD.json();

    expect(respD.status).toBe(200);
    expect(respDBody).toEqual({
      id: respDBody.id,
      username: "unique_username2",
      email: "uniqueusername@email.com",
      password: respDBody.password,
      created_at: respDBody.created_at,
      updated_at: respDBody.updated_at,
    });

    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
  });

  test("With unique 'email'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "unique_email",
        email: "uniqueemail@email.com",
        password: "uniqueemail",
      }),
    });

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/unique_email`,
      {
        method: "PATCH",
        body: JSON.stringify({
          email: "unique_email2@email.com",
        }),
      },
    );

    const respDBody = await respD.json();

    expect(respD.status).toBe(200);
    expect(respDBody).toEqual({
      id: respDBody.id,
      username: "unique_email",
      email: "unique_email2@email.com",
      password: respDBody.password,
      created_at: respDBody.created_at,
      updated_at: respDBody.updated_at,
    });

    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
  });

  test("With new 'password'", async () => {
    await fetch(`http://localhost:3000/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "new_password",
        email: "newpassword@email.com",
        password: "newpassword",
      }),
    });

    const respD = await fetch(
      `http://localhost:3000/api/v1/users/new_password`,
      {
        method: "PATCH",
        body: JSON.stringify({
          password: "newpassword2",
        }),
      },
    );

    const respDBody = await respD.json();

    const correctPasswordMatch = await password.comparePassword(
      "newpassword2",
      respDBody.password,
    );

    const incorrectPasswordMatch = await password.comparePassword(
      "newpassword",
      respDBody.password,
    );

    expect(respD.status).toBe(200);
    expect(respDBody.updated_at > respDBody.created_at).toBe(true);
    expect(correctPasswordMatch).toBe(true);
    expect(incorrectPasswordMatch).toBe(false);
  });
});
