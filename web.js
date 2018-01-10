/**
 * This file includes server address configuration
 * 
 * @author Melanie Vogel
 * @version 0.9
 */
var express = require('express');
var packageInfo = require('./package.json');
var session = require('express-session')

//Running on server
var app = express();

app.get('/', function (req, res) {
    res.json({ version: packageInfo.version });
});

var server = app.listen(process.env.PORT  || 5000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Web server started at http://%s:%s', host, port);
});
