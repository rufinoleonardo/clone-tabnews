import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";

async function create(userData) {
  await validateUniqueEmail(userData.email);
  await validateUniqueUsername(userData.username);

  async function validateUniqueEmail(email) {
    const emailSelect = await database.query({
      text: `
    SELECT 
     email 
    FROM 
      users
    WHERE
    LOWER(email) = LOWER($1)
    `,
      values: [email],
    });

    if (emailSelect.rows.length > 0) {
      throw new ValidationError({
        message: "O email informado já consta na base de dados.",
        action: "Utilize outro email.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const userSelect = await database.query({
      text: `
    SELECT
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    `,
      values: [username],
    });

    if (userSelect.rows.length > 0) {
      throw new ValidationError({
        message: "O username já está em uso.",
        action: "Por favor, tente outro username.",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const createdUser = await database.query({
      text: `
      INSERT 
      INTO users 
        (username, email, password) 
      VALUES 
        ($1, $2, $3)
      RETURNING *  
      `,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return createdUser.rows[0];
  }

  const newUser = await runInsertQuery(userData);
  return newUser;
}

async function findOne(username) {
  console.log("username :::::::::::: ", username);

  const response = await database.query({
    text: `
    SELECT 
      * 
    FROM 
      users
    WHERE
      LOWER(username) = LOWER($1)
    LIMIT 1
    `,
    values: [username],
  });

  if (!response.rows[0]) {
    throw new NotFoundError({
      message: "O username informado não foi localizado.",
      action: "Verifique se o username foi digitado corretamente",
    });
  }

  return response.rows[0];
}

const user = {
  create,
  findOne,
};

export default user;
