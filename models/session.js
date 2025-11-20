import database from "infra/database";
import { AuthenticationError } from "infra/errors";
import crypto from "node:crypto";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex"); // randomBytes retorna um Buffer
  const expiresAt = calculateExpirationDate();
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

async function findOneValidById(sessionId) {
  const returnedSession = await database.query({
    text: `
    SELECT
      *
    FROM
      sessions
    WHERE
      id = $1 
    AND
      expires_at > NOW()
    LIMIT
      1;
    `,
    values: [sessionId],
  });

  if (returnedSession.rowCount === 0) {
    throw new AuthenticationError({
      message: "Usuário não possui sessão ativa.",
      action: "Verifique se o usuário está logado e tente novamente",
    });
  }

  return returnedSession.rows[0];
}

async function findOneValidByToken(token) {
  const returnedSession = await database.query({
    text: `
    SELECT
      *
    FROM
      sessions
    WHERE
      token = $1 
    AND
      expires_at > NOW()
    LIMIT
      1;
    `,
    values: [token],
  });

  if (returnedSession.rowCount === 0) {
    throw new AuthenticationError({
      message: "Usuário não possui sessão ativa.",
      action: "Verifique se o usuário está logado e tente novamente",
    });
  }

  return returnedSession.rows[0];
}

async function renew(sessionId) {
  const expiresAt = calculateExpirationDate();
  const renewedSession = await runUpdateQuery(sessionId, expiresAt);

  return renewedSession.rows[0];

  async function runUpdateQuery(sessionId, expiresAt) {
    return await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at = $2,
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *;
      `,
      values: [sessionId, expiresAt],
    });
  }
}

function calculateExpirationDate() {
  return new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
}

const session = {
  create,
  EXPIRATION_IN_MILLISECONDS,
  findOneValidByToken,
  renew,
  findOneValidById,
};

export default session;
