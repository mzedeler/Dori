'use strict';

//TODO: Use https://www.npmjs.org/package/shelljs-nodecli

var express = require('express'),
    fs = require('fs'),
    sprintf = require('sprintf').sprintf,
    normalize = require('path').normalize,
    join = require('path').join,
    Tests = require('./tests.js');

var Constructor = function(path, uploadKey) {

  var mount = '/tests';
  var tests = new Tests(path, mount);
  var matches = normalize(path || '.').match('(.*)/?');
  path = matches[1];
  
  var app = express();
  app.use(mount, function(req, res, next) {
    if(req.method === 'GET') {
      if(req.url === '/') {
        res.set('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(tests.index(), null, '  '));
      } else {
        var test = tests.get(req.url);
        if(test) {
          var data = test.run(function(exitCode, output) {
            res.status(exitCode === 0 ? 200 : 525); // Custom error code for a failed test
            res.set('Content-Type', 'text/plain');
            res.send(output);
          });
        } else {
          next();
        }
      }
    } else if(req.method === 'POST') {
      
      if(uploadKey) {
        if(req.param('key') !== uploadKey) {
          res.status(401).send("Wrong upload key provided\r\n");
          return;
        }
      } else {
        res.status(401).send("Uploading disabled\r\n");
        return;
      }
      
      var urlPath = normalize(req.path);
      if(urlPath.match(/\.\./) || urlPath.match(/[^[:alnum:]\/]/)) {
        next();
      }

      var dest = join(path, urlPath);
      tests.extract(dest, req, function(err) {
        if(err) {
          res.status(500).send('Error while processing request: ' + err);
        } else {
          res.status(200).send("Fileset uploaded\r\n");
        }
        app.emit('dori:configUpdated', tests);
      });
    }
  });
  
  return app;
};

module.exports = Constructor;
