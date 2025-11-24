const {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
} = require("./errors");
import * as cookie from "cookie";
import session from "models/session";

function noMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  console.log(
    "\n Erro dentro do next-connect, estourou em 'infra/controller.js'",
  );
  console.log(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof AuthenticationError
  ) {
    return res.status(error.statusCode).json(error);
  }

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

function setSessionCookie(token, response) {
  const setCookie = cookie.serialize("session_id", token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

const controller = {
  errorHandlers: {
    onNoMatch: noMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
};

export default controller;
