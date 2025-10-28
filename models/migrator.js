const { default: database } = require("infra/database");
import { resolve } from "node:path";
import migrationsRunner from "node-pg-migrate";

const defaultMigrationsProps = {
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  dryRun: true,
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  const dbClient = await database.getNewClient();

  try {
    const pendingMigrations = await migrationsRunner({
      ...defaultMigrationsProps,
      dbClient,
    });

    return pendingMigrations;
  } finally {
    dbClient?.end();
  }
}

async function runPendingMigrations() {
  const dbClient = await database.getNewClient();

  try {
    const executedMigrations = await migrationsRunner({
      ...defaultMigrationsProps,
      dryRun: false,
      dbClient,
    });

    return executedMigrations;
  } finally {
    dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
