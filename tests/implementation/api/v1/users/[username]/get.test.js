describe("GET '/api/v1/users/[username]", () => {
  test("With exact matchcase", async () => {
    const response = await fetch(
      "http://localhost:3000/api/v1/users/leo_gostoso",
    );

    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "leo_gostoso",
      email: "Leo@teste.com",
      password: responseBody.password,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("With case missmatch", async () => {
    const response = await fetch(
      "http://localhost:3000/api/v1/users/Leo_gostoso",
    );

    const responseBody2 = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody2).toEqual({
      id: responseBody2.id,
      username: "leo_gostoso",
      email: "Leo@teste.com",
      password: responseBody2.password,
      created_at: responseBody2.created_at,
      updated_at: responseBody2.updated_at,
    });
  });

  test("With nonexistent username", async () => {
    const response3 = await fetch(
      "http://localhost:3000/api/v1/users/leonardo12",
    );

    const responseBody3 = await response3.json();

    expect(response3.status).toBe(400);
    expect(responseBody3).toEqual({
      name: "NotFoundError",
      message: "O username informado não foi localizado.",
      action: "Verifique se o username foi digitado corretamente",
      statusCode: 400,
    });
  });
});
