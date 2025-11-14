import user from "models/user";
import password from "models/password";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "infra/errors";

async function getAuthenticatedUser(userInputValues) {
  try {
    const foundUser = await user.findOneByEmail(userInputValues.email);

    await password.validate(userInputValues.password, foundUser.password);

    return foundUser;
  } catch (err) {
    if (
      err instanceof NotFoundError ||
      err instanceof ValidationError ||
      err instanceof AuthenticationError
    ) {
      throw new AuthenticationError({ cause: err });
    }

    throw err;
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
