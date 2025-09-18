import { Client } from "pg";

async function query(queryObject) {
  const localCredentials = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === "development" ? false : true,
  };

  const client = new Client(localCredentials);

  console.log("Credentials: ", localCredentials);

  try {
    await client.connect();
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    console.log("500_ERROR", err);
    throw err;
  } finally {
    await client.end();
  }
}

export default {
  query: query,
};
