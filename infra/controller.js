const { MethodNotAllowedError, InternalServerError } = require("./errors");

function noMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  console.log(
    "\n Erro dentro do next-connect, estourou em 'infra/controller.js'",
  );
  console.log(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  const publicErrorObject = new InternalServerError({
    cause: error,
    statusCode: error.statusCode,
  });

  console.log(
    "\n Erro dentro do next-connect, estourou em 'infra/controller.js'",
  );
  console.log(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: noMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
