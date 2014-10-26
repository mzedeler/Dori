'use strict';

//TODO: Use https://www.npmjs.org/package/shelljs-nodecli

var express = require('express'),
    fs = require('fs'),
    sprintf = require('sprintf').sprintf,
    normalize = require('path').normalize,
    join = require('path').join,
    tar = require('tar-fs'),
    zlib = require('zlib'),
    ensureDir = require('fs-extra').ensureDir,
    Tests = require('./tests.js');

var Constructor = function(path, uploadKey, debug) {

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
      ensureDir(dest, function(err) {
        if(!err) {
          if(debug) {
            var uploadPath = '/tmp/test.tar.gz';
            req.pipe(fs.createWriteStream(uploadPath));
          }
          var untar = tar.extract(dest);
          untar.on('finish', function() {
            app.emit('dori:uploaded', dest);
            res.status(200).send("Fileset uploaded\r\n");
            tests.updateConfig(function() {
              app.emit('dori:configUpdated', tests);
            });
          });
          var extractError = function(e) {
            res.status(500).send('Error while extracting package');
          };
          untar.on('error', extractError);
          var gunzip = zlib.createGunzip();
          gunzip.on('error', extractError);
          req.pipe(gunzip).pipe(untar);
        } else {
          res.status(500).send('Unable to upload to ' + req.url + "\r\n");
        }
      });
    }
  });
  
  return app;
};

module.exports = Constructor;
