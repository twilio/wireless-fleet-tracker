require("../views/login.html");

var loginView = {
    init: function (app, auth) {
        $('#input-form-submit').click(function () {
            app.login(auth.username, auth.password);
        });
    }
};

module.exports = loginView;
