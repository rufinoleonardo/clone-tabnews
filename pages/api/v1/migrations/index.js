import { createRouter } from "next-connect";
import database from "infra/database";
import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";
import controller from "infra/controller";

const router = createRouter();
router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

const defaultMigrationsProps = {
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  dryRun: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(request, response) {
  const dbClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationsRunner({
      ...defaultMigrationsProps,
      dbClient,
    });

    return response.status(200).json(pendingMigrations);
  } finally {
    dbClient.end();
  }
}

async function postHandler(request, response) {
  const dbClient = await database.getNewClient();

  try {
    const executedMigrations = await migrationsRunner({
      ...defaultMigrationsProps,
      dryRun: false,
      dbClient,
    });

    if (executedMigrations.length > 0) {
      return response.status(201).json(executedMigrations);
    }

    return response.status(200).json(executedMigrations);
  } finally {
    dbClient.end();
  }
}
