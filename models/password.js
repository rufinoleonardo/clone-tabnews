import { compare, hash } from "bcryptjs";

async function hashPasswordInObject(userData) {
  const rounds = process.env.NODE_ENV === "production" ? 14 : 1;
  return await hash(userData.password, rounds);
}

async function comparePassword(providedPassword, storedPassword) {
  const passwordMaches = await compare(providedPassword, storedPassword);
  return passwordMaches;
}

const password = {
  hashPasswordInObject,
  comparePassword,
};

export default password;
