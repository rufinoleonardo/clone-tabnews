import retry from "async-retry";
import database from "infra/database";

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

const orchestrator = { waitForAllProcesses, clearDatabase };

export default orchestrator;
