import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";

const router = createRouter();
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const reqBody = request.body;
  console.log(reqBody);

  const resp = await user.create(reqBody);

  return response.status(201).json(resp);
}
