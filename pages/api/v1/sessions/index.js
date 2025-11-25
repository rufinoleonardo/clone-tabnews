import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const { createRouter } = require("next-connect");

const router = createRouter();
router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser =
    await authentication.getAuthenticatedUser(userInputValues);

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionObj = await session.findOneValidByToken(sessionToken);

  const expiredSession = await session.expireById(sessionObj.id);
  controller.clearSessionCookie(res);

  res.status(200).json(expiredSession);
}
