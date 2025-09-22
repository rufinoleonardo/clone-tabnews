import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("Requisição Get para `api/v1/status` deverá retornar 200", async () => {
  const response = await fetch(`http://localhost:3000/api/v1/status`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();
  const receivedDate = new Date(responseBody.updated_at).toISOString();

  expect(responseBody.updated_at).toEqual(receivedDate);
  expect(responseBody.dependencies.database.version).toEqual("16.10");
  expect(responseBody.dependencies.database.opened_connections).toBeGreaterThan(
    0,
  );
  expect(responseBody.dependencies.database.max_connections).toEqual(100);
});
