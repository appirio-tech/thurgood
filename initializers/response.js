
exports.response = function (api, next) {
  api.response = {};

  /**
   * Return an error response
   * @param  {[type]} connection [description]
   * @param  {[type]} err        Error string or object
   * @param  {[type]} data       Response data
   * @param  {[type]} statusCode HTTP status code for the response
   * @return {[type]}            [description]
   */
  api.response.error = function(connection, err, data, statusCode) {
    connection.rawConnection.responseHttpCode = statusCode || 500;
    connection.error = err;
    connection.response = {
      success: false,
      message: err
    };

    if (data)
      connection.response.data = data;
  };

  /**
   * Return an error response with status code 400 Bad Request
   * @param  {[type]} connection [description]
   * @param  {[type]} err        Error string or object
   * @return {[type]}            [description]
   */
  api.response.badRequest = function(connection, err) {
    api.response.error(connection, err, undefined, 400);
  };

  /**
   * Return a success response
   * @param  {[type]} connection [description]
   * @param  {[type]} message    Success message
   * @param  {[type]} data       Response data
   * @param  {[type]} statusCode HTTP status code for the response
   * @return {[type]}            [description]
   */
  api.response.success = function(connection, message, data, statusCode) {
    connection.rawConnection.responseHttpCode = statusCode || 200;
    connection.response = { success: true };

    if (message)
      connection.response.message = message;
    if (data)
      connection.response.data = data;
  };

  /**
   * Return an error or a success response based on whether the err object is defined or not
   * @param  {[type]} connection        [description]
   * @param  {[type]} err               Error object that is checked. If it's falsy returns an error
   * @param  {[type]} message           Response message
   * @param  {[type]} data              Response data
   * @param  {[type]} statusCodeSuccess HTTP status code for the success response
   * @param  {[type]} statusCodeError   HTTP status code for the error response
   * @return {[type]}                   [description]
   */
  api.response.auto = function(connection, err, message, data, statusCodeSuccess, statusCodeError) {
    if (!err)
      api.response.success(connection, message, data, statusCodeSuccess);
    else
      api.response.error(connection, err, data, statusCodeError)
  };

  next();
};
