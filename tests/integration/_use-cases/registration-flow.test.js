const { default: activation } = require("models/activation");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: registration flow (all successful)", () => {
  let userABody;

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

    const activationToken = await activation.findOneByUserId(userABody.id);

    expect(lastEmail.sender).toBe("<contato@rufinodev.com.br>");
    expect(lastEmail.recipients[0]).toBe("<userA@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro em RufinoDev");
    expect(lastEmail.text).toContain("userA");
    expect(lastEmail.text).toContain(activationToken.id);

    console.log(lastEmail.text);
  });

  test("C) Activate account", async () => {});

  test("D) Login", async () => {});

  test("E) Get user informations", async () => {});
});
