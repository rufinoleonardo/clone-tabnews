import controller from "infra/controller";
import user from "models/user";

const { createRouter } = require("next-connect");

const router = createRouter();
router.get(getHandler);
router.patch(patchHandler);

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

  const updatedUser = await user.updateUser(username, userInputValues);

  response.status(200).json(updatedUser);
}
