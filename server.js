/*
    Small node.js example of a server.js main file using the express framework with oauth2 validation and a custom api script.
*/

var express = require('express'),
    oauthserver = require('node-oauth2-server');
    api = require("./api");

var app = express();

app.configure(function() {
    var oauth = oauthserver({
        model: require('./oauth'), 
        grants: ['password'],
        debug: true,
        allow:{ get: "/" },

    });
    app.use(express.bodyParser()); // REQUIRED
    app.use(oauth.handler());
    app.use(oauth.errorHandler());
});


app.get('/', function (req, res) {
    res.send('Sem REST API documentation will follow');
});

app.get('/rest/entities', function(req, res){
    api.getAllEntity(req.user.id, res);
});

app.get('/rest/entities/:id', function(req, res){
    api.getEntity(req.user.id, req.params.id, res);
});

app.post('/rest/entities/:id', function(req, res){
    api.updateClient(req.user.id, req.params.id, req.body, res);
});

app.get('/test', function(req, res){
    res.send(api.test(req.user.id));
});

app.get('/rest/forms', function(req, res){
    api.getForms(req.user.id, req.params.id, res);
});

app.get('/rest/forms/:id', function(req, res){
    api.getFormValues(req.user.id, req.params.id, res);
});

app.get('/rest/form-formats', function(req, res){
    api.getFormValues(req.user.id, req.params.id, res);
});

app.listen(3000);
console.log("listening 3000")