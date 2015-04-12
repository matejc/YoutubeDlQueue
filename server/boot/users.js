module.exports = function createUser(server) {

  var User = server.models.User;
  var Role = server.models.Role;
  var RoleMapping = server.models.RoleMapping;
  var helpers = require('../helpers');
  var users = require('../users.json');

  helpers.setMethodsVisibility(User, ['login', 'logout']);
  // User.disableRemoteMethod('create', true);

  var createUser = function(username, email, password, role, login) {
    User.findOrCreate({
      where: {username: username}
    }, {
      username: username, email: email, password: password
    }, function(err, user) {
      if (err) throw err;
      Role.findOrCreate({
        name: role
      },{
        name: role
      }, function(err, role) {
        if (err) throw err;
        role.principals.create({
          principalType: RoleMapping.USER,
          principalId: user.id
        }, function(err, principal) {
          if (err) throw err;
          if (!login) return;
          User.login({username: username, password: password}, function(err, accessToken) {
            if (err) throw err;
            console.log(accessToken);
          });
        });
      });
    });
  };

  for (var i in users) {
    createUser(users[i].username, users[i].email, users[i].password, users[i].role, users[i].username==='admin');
  }

};
