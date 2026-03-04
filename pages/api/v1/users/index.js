import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const reqBody = request.body;
  const loggedUser = request.context.user;

  const newUser = await user.create(reqBody);
  const secureOutputValues = authorization.filterOutput(
    loggedUser,
    "read:user",
    newUser,
  );

  // 1. Criar o token de ativação
  const activationToken = await activation.create(newUser.id);

  // 2. Enviar o token para o user
  await activation.sendEmailToUser(newUser, activationToken);

  return response.status(201).json(secureOutputValues);
}
