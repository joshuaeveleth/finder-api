/**
 * AuthController
 *
 * @description :: Server-side logic for managing authentication
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var google = require('googleapis');

module.exports = {
  google: function(req, res) {
    var CLIENT_ID = req.body.clientId,
      CLIENT_SECRET = process.env.GOOGLE_SECRET,
      REDIRECT_URI = req.body.redirectUri,
      scopes = ['https://www.googleapis.com/auth/plus.me'],
      plus = google.plus('v1'),
      OAuth2 = google.auth.OAuth2;

    var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI),
      url = oauth2Client.generateAuthUrl({ scope: scopes });

    google.options({ auth: oauth2Client });

    oauth2Client.getToken(req.body.code, function (err, tokens) {
      if (err) return res.negotiate(err);
      oauth2Client.setCredentials(tokens);

      plus.people.get({ userId: 'me' }, function (err, profile) {
        if (err) return res.negotiate(err);

        // Find or Create a user account
        User.findOne({ email: profile.emails[0].value }).exec(function(err, foundUser) {
          if (err) return res.negotiate(err);
          if (foundUser) {
            var jwt = sailsTokenAuth.createToken(foundUser);
            return res.send({ token: jwt });
          } else {

            var params = {
              email: profile.emails[0].value
            };

            User.create(params).exec(function (err, newUser) {
              if(err) return res.negotiate(err);
              var jwt = sailsTokenAuth.createToken(newUser);
              res.send({ token: jwt });
            });
          }
        });
      });
    });
  }
};
