import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const { createRouter } = require("next-connect");

const router = createRouter();
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser =
    await authentication.getAuthenticatedUser(userInputValues);

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  return res.status(201).json(newSession);
}
