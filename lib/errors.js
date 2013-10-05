
function NotFoundError(message) {
  this.name = "NotFoundError";
  this.message = message || "Resource is not found";
}
NotFoundError.prototype = new Error();
NotFoundError.prototype.constructor = NotFoundError;

exports.NotFoundError = NotFoundError;


function BadRequestError(message) {
  this.name = "BadRequestError";
  this.message = message || "bad request error";
}
BadRequestError.prototype = new Error();
BadRequestError.prototype.constructor = BadRequestError;

exports.BadRequestError = BadRequestError;