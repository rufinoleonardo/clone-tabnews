import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();
router.get(getHandler);
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseName = process.env.POSTGRES_DB;

  // * OBTENDO A VERSÃO DO BANCO DE DADOS
  const pgVersionQuery = await database.query("SHOW server_version;");
  const version = pgVersionQuery.rows[0].server_version;

  // * OBTENDO A QUANTIDADE DE CONEXÕES USADAS
  const connectionsQuery = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity where datname=$1",
    values: [databaseName],
  });

  const openedConnections = connectionsQuery.rows[0].count;

  // * OBTENDO O NUMERO MÁXIMO DE CONEXÕES
  const maxConnectionsQuery = await database.query("SHOW max_connections;");
  const maxConnections = Number(maxConnectionsQuery.rows[0].max_connections);

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: version,
        opened_connections: openedConnections,
        max_connections: maxConnections,
      },
    },
  });
}
