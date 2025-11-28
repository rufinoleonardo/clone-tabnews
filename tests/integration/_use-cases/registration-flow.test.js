const { default: webserver } = require("infra/webserver");
const { default: activation } = require("models/activation");
const { default: user } = require("models/user");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow (all successful)", () => {
  let userABody;
  let validToken;

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

    userABody = await userA.json();

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

  test("B) Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@rufinodev.com.br>");
    expect(lastEmail.recipients[0]).toBe("<userA@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro em RufinoDev");
    expect(lastEmail.text).toContain("userA");

    // Validating email's token
    const regexResult = orchestrator.extractUUID(lastEmail.text);
    validToken = await activation.findValidToken(regexResult);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/activation/${validToken.id}`,
    );
    expect(validToken.user_id).toBe(userABody.id);
    expect(validToken.used_at).toBe(null);
  });

  test("C) Activate account", async () => {
    const responseC = await fetch(
      `http://localhost:3000/api/v1/activations/${validToken.id}`,
      {
        method: "PATCH",
      },
    );

    const responseCBody = await responseC.json();

    expect(Date.parse(responseCBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("userA");
    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("D) Login", async () => {});

  test("E) Get user informations", async () => {});
});
