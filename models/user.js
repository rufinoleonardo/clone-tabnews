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

async function updateUser(username, userInputValues) {
  const foundUser = await findOneByUsername(username);
  let updatedData = userInputValues;

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    const hashedPassword = await password.hashPasswordInObject(userInputValues);
    updatedData = { ...updatedData, password: hashedPassword };
  }

  const userDataToUpdate = { ...foundUser, ...updatedData };

  return await runUpdateQuery(userDataToUpdate);
}

async function runUpdateQuery(userDataToUpdate) {
  const response = await database.query({
    text: `
      UPDATE
        users
      SET
        username = $2,
        email = $3,
        password = $4,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
      `,
    values: [
      userDataToUpdate.id,
      userDataToUpdate.username,
      userDataToUpdate.email,
      userDataToUpdate.password,
    ],
  });

  return response.rows[0];
}

async function findOneById(userId) {
  const returnedData = await database.query({
    text: `
    SELECT
      *
    FROM
      users
    WHERE
      id = $1
    LIMIT 1
    `,
    values: [userId],
  });

  if (returnedData.rowCount === 0) {
    throw new NotFoundError({
      message: "O id informado não foi localizado no sistema.",
      action: "Verifique se o id foi digitado corretamente.",
    });
  }

  return returnedData.rows[0];
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
      action: "Verifique se o username foi digitado corretamente.",
    });
  }

  return response.rows[0];
}

async function findOneByEmail(email) {
  const response = await database.query({
    text: `
    SELECT 
      * 
    FROM 
      users
    WHERE
      LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    values: [email],
  });

  if (!response.rows[0]) {
    throw new NotFoundError({
      message: "O email informado não foi localizado.",
      action: "Verifique se o email foi digitado corretamente.",
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
      message: "O email informado já está em uso.",
      action: "Utilize outro email para realizar a operação.",
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
      message: "O username informado já está em uso.",
      action: "Utilize outro username para realizar a operação.",
    });
  }
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  updateUser,
};

export default user;
