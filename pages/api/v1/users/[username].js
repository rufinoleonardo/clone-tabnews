import controller from "infra/controller";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const reqParam = request.query.username;

  const resp = await user.findOneByUsername(reqParam);

  response.status(200).json(resp);
}

async function patchHandler(request, response) {
  const { username } = request.query;
  const userInputValues =
    typeof request.body == "string" ? JSON.parse(request.body) : request.body;
  //const userInputValues = request.body;

  const loggedUser = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(loggedUser, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui autorização para modificar outro usuário.",
      action:
        "Verifique se você possui as features necessárias para alterar outro usuário.",
    });
  }

  const updatedUser = await user.updateUser(username, userInputValues);

  response.status(200).json(updatedUser);
}
