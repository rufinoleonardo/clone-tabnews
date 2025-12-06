import activation from "models/activation";
import controller from "infra/controller";
const { createRouter } = require("next-connect");

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const tokenId = request.query.tokenId;

  const validActivationToken = await activation.findValidToken(tokenId);

  await activation.activateUserByUserId(validActivationToken.user_id);
  const updatedToken = await activation.markTokenAsUsed(
    validActivationToken.id,
  );

  response.status(200).json(updatedToken);
}
