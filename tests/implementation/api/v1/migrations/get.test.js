const { default: database } = require("infra/database");
const { default: orchestrator } = require("tests/orchestrator");

beforeAll(async () => {
  await orchestrator.waitForAllProcesses();
  await cleanDatabase();
});

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("Requisição Get para `api/v1/migrations` deverá retornar 200", async () => {
  const response = await fetch(`http://localhost:3000/api/v1/migrations`);
  expect(response.status).toBe(200);

  const responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
});
