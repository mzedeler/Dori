'use strict';

var http = require('http'),
    url = require('url'),
    glob = require('glob'),
    fs = require('fs'),
    querystring = require('querystring'),
    rm = require('shelljs').rm,
    archive = require('./archive.js');

module.exports = function(path, serverUrl, key, callback) {
    var options = url.parse(serverUrl + '?' + querystring.stringify({key: key}));
    options.method = 'POST';
    options.headers = {
      'Content-Type': 'application/octet-stream'
    };
    var req = http.request(options, function(response) {
      var body = '';
      response.on('data', function(chunk) { body += chunk; });
      response.on('end', function() {
        var error;
        if(response.statusCode !== 200) {
          error = body.trim();
        }
        callback(error);
      });
    });
    archive.pack(path, req);
};

