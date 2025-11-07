import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import { faker } from "@faker-js/faker";

async function waitForAllProcesses() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw new Error(`ERROR ${response.status}: An error occurred.`);
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userData) {
  return await user.create({
    username:
      userData?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userData?.email || faker.internet.email(),
    password: userData?.password || "validPassword",
  });
}

const orchestrator = {
  waitForAllProcesses,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
