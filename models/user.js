import database from "infra/database";
import { NotFoundError, ValidationError } from "infra/errors";
import password from "./password";

async function create(userData) {
  await validateUniqueEmail(userData.email);
  await validateUniqueUsername(userData.username);
  const hashedPassword = await password.hashPasswordInObject(userData);
  const userWithHashedPassword = { ...userData, password: hashedPassword };

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

  const newUser = await runInsertQuery(userWithHashedPassword);
  return newUser;
}

async function findOneByUsername(username) {
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

const user = {
  create,
  findOneByUsername,
};

export default user;
