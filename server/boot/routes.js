/**
* This boot script defines custom Express routes not tied to models
**/

module.exports = function(app) {

  /**
  * Defines a routes so that blogs are accessible by user
  * and slug: /jeffdonthemic/hello-world instead of id.
  **/
  app.get('/test', function(req, res) {
    res.send('test done');
  });

}
