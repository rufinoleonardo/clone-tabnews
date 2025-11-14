import { compare, hash } from "bcryptjs";
import { AuthenticationError } from "infra/errors";

async function hashPasswordInObject(userData) {
  const rounds = process.env.NODE_ENV === "production" ? 14 : 1;
  return await hash(userData.password, rounds);
}

async function comparePassword(providedPassword, storedPassword) {
  const passwordMaches = await compare(providedPassword, storedPassword);
  return passwordMaches;
}

async function validate(providedPassword, storedPassword) {
  try {
    const passwordMatch = await comparePassword(
      providedPassword,
      storedPassword,
    );

    if (!passwordMatch) {
      throw new AuthenticationError({
        message: "Senha fornecida não confere.",
        action: "Redigite ou redefina sua senha.",
      });
    }
  } catch (error) {
    console.log("".padEnd(50, "*"));
    console.log(error);
    console.log("".padEnd(50, "*"));

    throw error;
  }
}

const password = {
  hashPasswordInObject,
  comparePassword,
  validate,
};

export default password;
