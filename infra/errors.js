export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno inesperado ocorreu.", { cause: cause });
    this.name = "InternalServerError";
    (this.action = "Entre em contato com o suporte"),
      (this.statusCode = statusCode || 500);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Serviço indisponível no momento.", { cause: cause });
    this.name = "InternalServerError";
    (this.action = "Verifique se o serviço está disponível."),
      (this.statusCode = 503);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Algum dos dados enviados estão em conflito.", {
      cause: cause,
    });
    this.name = "ValidationError";
    this.statusCode = 400;
    this.action = action || "Verifique os dados e reenvie o formulário.";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class AuthenticationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Dados não conferem com a base de dados.", {
      cause: cause,
    });
    this.name = "AuthenticationError";
    this.statusCode = 401;
    this.action = action || "Verifique os dados e reenvie o formulário.";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido para este endpoint");
    this.name = "MethodNotAllowedError";
    (this.action =
      "Verifique se o método HTTP enviado é válido para este endpoint"),
      (this.statusCode = 405);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ message, action }) {
    super(message || "Registro não encontrado");
    this.name = "NotFoundError";
    (this.action = action || "Verifique os dados digitados."),
      (this.statusCode = 404);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      statusCode: this.statusCode,
    };
  }
}
