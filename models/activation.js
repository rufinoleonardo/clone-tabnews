import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "models/user";
import authorization from "./authorization";

const EXPIRATION_IN_MILLISECONDS = 1000 * 60 * 15; // 15s

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;      
      `,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "RufinoDev <contato@rufinodev.com.br",
    to: user.email,
    subject: "Ative seu cadastro em RufinoDev",
    text: `${user.username}, clique no link abaixo para ativar o seu cadastro no RufinoDev
    
${webserver.origin}/cadastro/activation/${activationToken.id}
    
Atenciosamente,
RufinoDev`,
  });
}

async function findValidToken(token) {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      user_activation_tokens
    WHERE
      id = $1
      AND expires_at > NOW()
      AND used_at IS NULL
    LIMIT
      1
    `,
    values: [token],
  });

  if (results.rows.length == 0) {
    console.log("findValidToken >  if (results.rows.lenth == 0)");
    throw new NotFoundError({
      message: "Token inválido.",
      action: "Entre em contato com o suporte",
    });
  }

  return results.rows[0];
}

async function markTokenAsUsed(tokenId) {
  const updatedToken = await runUpdateQuery(tokenId);

  return updatedToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = NOW(),
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
      ;
      `,
      values: [tokenId],
    });

    if (results.rows.lenth == 0) {
      throw new NotFoundError({
        message: "Token não localizado. Nenhum registro foi atualizado.",
      });
    }

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const userResponse = await user.findOneById(userId);

  if (!authorization.can(userResponse, "read:activation_token")) {
    throw new ForbiddenError({
      message: "Você não pode mais utilizar tokens de ativação.",
      action: "Caso acredite seja um engano, contatar o suporte",
    });
  }

  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findValidToken,
  markTokenAsUsed,
  activateUserByUserId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
