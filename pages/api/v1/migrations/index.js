import database from "infra/database";
import migrationsRunner from "node-pg-migrate";
import { join } from "node:path";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationsProps = {
    dbClient: dbClient,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    dryRun: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method == "GET") {
    const pendingMigrations = await migrationsRunner(defaultMigrationsProps);

    await dbClient.end();

    return response.status(200).json(pendingMigrations);
  }

  if (request.method == "POST") {
    const executedMigrations = await migrationsRunner({
      ...defaultMigrationsProps,
      dryRun: false,
    });

    await dbClient.end();

    if (executedMigrations.length > 0) {
      return response.status(201).json(executedMigrations);
    }

    return response.status(200).json(executedMigrations);
  }

  return response.status(405).end();
}
