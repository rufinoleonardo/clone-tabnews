import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "LeoGmail <leonardo@email.com>",
      to: "rufinoleonardo@outlook.com",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });

    await email.send({
      from: "LeoGmail <leonardo@email.com>",
      to: "rufinoleonardo@outlook.com",
      subject: "Segundo e-mail",
      text: "Teste de corpo 2o email",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<leonardo@email.com>");
    expect(lastEmail.recipients[0]).toBe("<rufinoleonardo@outlook.com>");
    expect(lastEmail.subject).toBe("Segundo e-mail");
    expect(lastEmail.text).toBe("Teste de corpo 2o email\n");
  });
});
