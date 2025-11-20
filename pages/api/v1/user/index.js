import controller from "infra/controller";
import session from "models/session";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionIdToken = req.cookies.session_id;

  const validSession = await session.findOneValidByToken(sessionIdToken);
  const renewedSession = await session.renew(validSession.id);

  controller.setSessionCookie(renewedSession.token, res);
  const returnedUser = await user.findOneById(validSession.user_id);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return res.status(200).json(returnedUser);
}
