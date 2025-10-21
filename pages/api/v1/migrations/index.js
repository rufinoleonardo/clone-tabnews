import database from "infra/database";
import migrationsRunner from "node-pg-migrate";
import { resolve } from "node:path";

export default async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];

  if (!allowedMethods.includes(request.method)) {
    return response
      .status(405)
      .json({ error: `Method "${request.method}" is not allowed.` });
  }

  const dbClient = await database.getNewClient();

  const defaultMigrationsProps = {
    dbClient: dbClient,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    dryRun: true,
    migrationsTable: "pgmigrations",
  };

  try {
    if (request.method == "GET") {
      const pendingMigrations = await migrationsRunner(defaultMigrationsProps);

      return response.status(200).json(pendingMigrations);
    }

    if (request.method == "POST") {
      const executedMigrations = await migrationsRunner({
        ...defaultMigrationsProps,
        dryRun: false,
      });

      if (executedMigrations.length > 0) {
        return response.status(201).json(executedMigrations);
      }

      return response.status(200).json(executedMigrations);
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    dbClient.end();
  }
}
