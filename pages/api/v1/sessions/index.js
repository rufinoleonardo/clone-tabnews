import controller from "infra/controller";
import { ForbiddenError } from "infra/errors";
import authentication from "models/authentication";
import authorization from "models/authorization";
import session from "models/session";

const { createRouter } = require("next-connect");

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser =
    await authentication.getAuthenticatedUser(userInputValues);

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso acredite que seja um erro.",
    });
  }
  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, res);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );
  return res.status(201).json(secureOutputValues);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const loggedUser = req.context.user;

  const sessionObj = await session.findOneValidByToken(sessionToken);

  const expiredSession = await session.expireById(sessionObj.id);
  controller.clearSessionCookie(res);

  const secureOutputValues = authorization.filterOutput(
    loggedUser,
    "read:session",
    expiredSession,
  );

  res.status(200).json(secureOutputValues);
}
