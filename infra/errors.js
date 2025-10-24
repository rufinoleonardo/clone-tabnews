export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno inesperado ocorreu.", { cause: cause });
    this.name = "InternalServerError";
    (this.action = "Entre em contato com o suporte"), (this.statusCode = 500);
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
