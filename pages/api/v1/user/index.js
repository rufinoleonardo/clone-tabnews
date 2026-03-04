import controller from "infra/controller";
import authorization from "models/authorization";
import session from "models/session";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionIdToken = req.cookies.session_id;
  const loggedUser = req.context.user;

  const validSession = await session.findOneValidByToken(sessionIdToken);
  const renewedSession = await session.renew(validSession.id);

  controller.setSessionCookie(renewedSession.token, res);
  const returnedUser = await user.findOneById(validSession.user_id);

  const secureOutputValues = authorization.filterOutput(
    loggedUser,
    "read:user:self",
    returnedUser,
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return res.status(200).json(secureOutputValues);
}
