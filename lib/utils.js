var Errors = require("../lib/errors");

function setDataForResponse(connection, data) {
  connection.rawConnection.responseHttpCode = 200;
  connection.response = {
    success: true,
    data: data
  };
}

function setErrorForResponse(connection, error) {
  if(error instanceof Errors.NotFoundError)  {
    connection.rawConnection.responseHttpCode = 404;
    connection.response = {
      error: "Not Found",
      errorDescription: error.message
    }
  }
  else if(error instanceof Errors.BadRequestError) {
    connection.rawConnection.responseHttpCode = 400;
    connection.response = {
      error: "Bad Request",
      errorDescription: error.message
    }    
  }
  else {
    connection.rawConnection.responseHttpCode = 500;
    connection.response = {
      error: "Internal Server Error",
      errorDescription: error.message
    }
  }
}

exports.setDataForResponse = setDataForResponse;
exports.setErrorForResponse = setErrorForResponse;