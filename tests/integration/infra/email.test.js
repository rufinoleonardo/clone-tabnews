import email from "infra/email";

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "LeoGmail <leonardo@email.com>",
      to: "rufinoleonardo@outlook.com",
      subject: "Teste de assunto",
      text: "Teste de corpo",
    });
  });
});
