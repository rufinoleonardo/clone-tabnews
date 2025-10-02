import retry from "async-retry";

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

const orchestrator = { waitForAllProcesses };

export default orchestrator;
