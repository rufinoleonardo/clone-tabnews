import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";
  let databaseData = {
    version: "Carregando...",
    openedConnections: "Carregando...",
    maxConnections: "Carregando",
  };

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    (databaseData.version = data.dependencies.database.version),
      (databaseData.openedConnections =
        data.dependencies.database.opened_connections),
      (databaseData.maxConnections =
        data.dependencies.database.max_connections);
  }
  return (
    <>
      <UpdatedAt updatedAtText={updatedAtText} />
      <DatabaseStatusInfo
        version={databaseData.version}
        openedConnections={databaseData.openedConnections}
        maxConnections={databaseData.maxConnections}
      />
    </>
  );
}

function UpdatedAt({ updatedAtText }) {
  return (
    <>
      <h1>Status</h1>
      <pre>Última atualização: {updatedAtText}</pre>
    </>
  );
}

function DatabaseStatusInfo({ version, openedConnections, maxConnections }) {
  return (
    <>
      <h1>Database</h1>
      <pre>Versão: {version}</pre>
      <pre>Conexões abertas: {openedConnections}</pre>
      <pre>Conexões máximas: {maxConnections}</pre>
    </>
  );
}
