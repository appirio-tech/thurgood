'use strict';


var request = require('request');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var ALLOWED_GMAIL_DOMAINS = process.env.ALLOWED_GMAIL_DOMAINS.split(',');
var oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

var maxAge = 1209600; // Default time of User Login response

/**
 *
 * @param request {Object} The Express Request Object
 * @returns {Object} Query Parameters
 */
function parseCookies(request) {
    var list = {}, rc = decodeURIComponent(request.headers.cookie);
    rc && rc.split(';').forEach(function(cookie){
        var parts = cookie.split('=');
        list[parts.shift().trim()] = parts.join('=');
    });
    return list;
}

/**
 * This boot script defines custom Express routes not tied to models
 **/
module.exports = function (app) {
    var User = app.models.User;

    /**
     * Google Oauth (Code -> Token)
     */
    app.get('/auth/google/callback', function (req, res) {
        var code = req.query.code;
        function errorHandler(err) {
            res.status(400).send({error: err});
        }

        /**
         * Get access_token from Code
         */
        oauth2Client.getToken(code, function (err, tokens) {
            if (!err) {
                res.cookie('access_token', tokens.access_token, { maxAge: maxAge });
                res.cookie('token_type', tokens.token_type, { maxAge: maxAge });
                res.cookie('id_token', tokens.id_token, { maxAge: maxAge });
                res.cookie('refresh_token', tokens.refresh_token, { maxAge: maxAge });
                res.redirect('/auth/google');
            } else {
                errorHandler(err);
            }
        });
    });

    /**
     * Login Handler: Get User details from Google and create/get, signin User
     */
    app.get('/auth/google', function(req, res){
        var cookies = parseCookies(req);
        function errorHandler(err) {
            res.status(400).send({error: err});
        }

        /**
         * Refreshes Token
         */
        if(cookies.refresh_token){
            oauth2Client.setCredentials(cookies);
            oauth2Client.refreshAccessToken(function(err, tokens) {
                if(!err){
                    getEmail(tokens.access_token);
                }else{
                    errorHandler(err);
                }
            });
        }else{
            var scopes = [
                'https://www.googleapis.com/auth/userinfo.email'
            ];
            var url = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes
            });
            res.redirect(url);
        }

        /**
         * Checks for allowable domain names
         */
        function checkDomainName(email){
            var domain = '@' + email.split('@').pop();
            return ALLOWED_GMAIL_DOMAINS.indexOf(domain) > -1;
        }

        /**
         * Creates / Gets User from database
         */
        function getOrCreateUser(email){
            var username = 'gmail:' + email.split('@')[0];
            User.create({
                username: username,
                email: email,
                password: process.env.THURGOOD_ADMIN_PASSWORD
            }, function(err, user){
                signInUser(user);
            });
        }

        /**
         * Signin User
         */
        function signInUser(user){
            User.login({
                username: user.username,
                password: process.env.THURGOOD_ADMIN_PASSWORD
            }, function(err, accessToken) {
                if(!err){
                    res.cookie('api_token', accessToken.id);
                    res.cookie('api_userid', accessToken.userId);
                    res.redirect('/');
                }else{
                    errorHandler(err);
                }
            });
        }

        /**
         * Get Email, Name from Google
         */
        function getEmail(access_token){
            request({
                uri: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + access_token,
                method: "GET",
                json: true
            }, function(error, response, body) {
                if(!error){
                    var email = body.email;
                    res.cookie('name', body.given_name || body.name);
                    if(checkDomainName(email)){
                        getOrCreateUser(email);
                    }else{
                        errorHandler({ error: 'Email Ids from this domain name are not allowed!' });
                    }
                }else{
                    errorHandler(error);
                }
            });
        }
    });

    /**
     * Logout Handler
     */
    app.get('/auth/logout', function (req, res) {
        var cookies = parseCookies(req);
        function errorHandler(err) {
            res.status(400).send({error: err});
        }

        User.logout(cookies.api_token, function(err) {
            if(!err){
                res.clearCookie('access_token');
                res.clearCookie('token_type');
                res.clearCookie('id_token');
                res.clearCookie('refresh_token');
                res.clearCookie('api_token');
                res.clearCookie('api_userid');
                res.clearCookie('name');
                res.redirect('/');
            }else{
                errorHandler(err);
            }
        });
    });

};
