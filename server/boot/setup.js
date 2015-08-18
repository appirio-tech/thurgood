/**
* This boot script ensures that an admin user always exists
**/

module.exports = function(app) {
  var User = app.models.User;
  var Role = app.models.Role;

  User.create([
    {
      username: 'thurgood',
      email: 'admin@thurgood.appirio.com',
      password: process.env.THURGOOD_ADMIN_PASSWORD
    }
  ]);

};
