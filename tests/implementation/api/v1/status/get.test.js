test("Requisição Get para `api/v1/status` deverá retornar 200", async () => {
  const response = await fetch(`http://localhost:3000/api/v1/status`);
  expect(response.status).toBe(200);
});
