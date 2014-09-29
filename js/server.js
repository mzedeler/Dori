'use strict';

var glob = require('glob');
var express = require('express');
var sprintf = require('sprintf').sprintf;
var spawn = require('child_process').spawn;
var dirname = require('path').dirname;
var normalize = require('path').normalize;
var join = require('path').join;
var fs = require('fs');
var unzip = require('unzip');
var fstream = require('fstream');
var ensureDir = require('fs-extra').ensureDir;

var Constructor = function(path, uploadKey) {

  if(!uploadKey) {
    console.warn('No uploadKey provided. This makes it possible for anybody to upload tests!');
  }
  
  var mount = '/tests';
  var matches = normalize(path || '.').match('(.*)/?');
  path = matches[1];
  
  var tests = {
    config: {}
  };
  tests.updateConfig = function() {
    var config = {}, index = {
      tests: {},
      errors: {}
    };
    glob.sync(path + '/**/test.manifest')
      .forEach(function(manifestPath) {
        try {
          var manifest = JSON.parse(fs.readFileSync(manifestPath));
          if(manifest.tests) {
            var baseUrl = dirname(manifestPath).substr(path.length);
            var workDir = dirname(manifestPath);
            manifest.tests.forEach(function(test) {
              if(test.command) {
                index.tests[join(mount, baseUrl, test.name)] = {};
                test.run = function(callback) {
                  var child = spawn(test.command, test.parameters, { cwd: workDir });
                  var output = '';
                  if(child) {
                    child.stdout.on('data', function(data) { output += data });
                    child.stderr.on('data', function(data) { output += data });
                    child.on('close', function(exitCode) { callback(exitCode, output) });
                  } else {
                    callback(1, 'No available extension for this test.');
                  }
                  return;
                };
                config[join(baseUrl, test.name)] = test;
              }
            });
          }
        } catch(e) {
          index.errors[manifestPath] = 'Unable to parse manifest: ' + e;
        }
      });
    this.config = config;
    this.index = index;
  };

  tests.updateConfig();
  
  var app = express();
  app.use(mount, function(req, res, next) {
    if(req.method == 'GET') {
      if(req.url == '/') {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(tests.index, null, '  '));
      } else {
        var test = tests.config[req.url];
        if(test) {
          var data = test.run(function(exitCode, output) {
            res.statusCode = exitCode == 0 ? 200 : 525; // Custom error code for a failed test
            res.set('Content-Type', 'text/plain');
            res.send(output);
          });
        } else {
          next();
        }
      }
    } else if(req.method == 'POST') {
      
      if(uploadKey) {
        if(req.param('key') != uploadKey) {
          res.send(401, "Wrong upload key provided\r\n");
          return;
        }
      }
      
      var url = normalize(req.url);
      if(url.match(/\.\./) || url.match(/[^[:alnum:]\/]/)) {
        next();
      }

      var dest = join(path, url);
      ensureDir(dest, function(err) {
        if(!err) {
          req.pipe(unzip.Parse()).on('entry', function(entry) { console.log(entry.path) }).pipe(fstream.Writer({path: dest}));
          res.send(200, "Fileset uploaded\r\n");
          tests.updateConfig();
        } else {
          res.send(500, 'Unable to upload to ' + req.url + "\r\n");
        }
      });
    }
  });
  
  return app;
};

module.exports = Constructor;
