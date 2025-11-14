import database from "infra/database";
import crypto from "node:crypto";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex"); // randomBytes retorna um Buffer
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newSession = await runInsertQuery(userId, token, expiresAt);

  async function runInsertQuery(userId, token, expiresAt) {
    return await database.query({
      text: `
      INSERT INTO
        sessions (user_id, token ,expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
      `,
      values: [userId, token, expiresAt],
    });
  }

  return newSession.rows[0];
}

const session = {
  create,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
