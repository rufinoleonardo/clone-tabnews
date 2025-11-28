import activation from "models/activation";

const { default: controller } = require("infra/controller");
const { createRouter } = require("next-connect");

const router = createRouter();
router.patch(handlePatch);

export default router.handler(controller.errorHandlers);

async function handlePatch(request, response) {
  const tokenId = request.query.tokenId;

  const updatedToken = await activation.markTokenAsUsed(tokenId);
  await activation.activateUserByUserId(updatedToken.user_id);

  response.status(200).json(updatedToken);
}
