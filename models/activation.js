import database from "infra/database";
import email from "infra/email";
import webserver from "infra/webserver";

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

async function findOneByUserId(userId) {
  const results = await database.query({
    text: `
    SELECT
      *
    FROM
      user_activation_tokens
    WHERE
      user_id = $1
    LIMIT
      1
    ;
    `,
    values: [userId],
  });

  return results.rows[0];
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
