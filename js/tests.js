'use strict';

var spawn = require('child_process').spawn,
    dirname = require('path').dirname,
    glob = require('glob'),
    ensureDir = require('fs-extra').ensureDir,
    fs = require('fs'),
    tar = require('tar-fs'),
    zlib = require('zlib');

var Constructor = function(path, mount) {
  this.path = path;
  this.mount = mount;
  this.updateConfig();
};

Constructor.prototype.updateConfig = function(callback) {
  var config = {};
  var index = {
    tests: {},
    errors: {}
  };
  var self = this;
  glob.sync(self.path + '/**/test.manifest')
    .forEach(function(manifestPath) {
      try {
        var manifest = JSON.parse(fs.readFileSync(manifestPath));
        if(manifest.tests) {
          var baseUrl = dirname(manifestPath).substr(self.path.length);
          var workDir = dirname(manifestPath);
          manifest.tests.forEach(function(test) {
            if(test.command) {
              index.tests[self.mount.concat(baseUrl, '/', test.name)] = {};
              test.run = function(callback) {
                var child = spawn(test.command, test.parameters, { cwd: workDir });
                var output = '';
                if(child) {
                  child.stdout.on('data', function(data) { output += data; });
                  child.stderr.on('data', function(data) { output += data; });
                  child.on('close', function(exitCode) { callback(exitCode, output); });
                } else {
                  callback(1, 'Spawning test failed.');
                }
                return;
              };
              config[baseUrl.concat('/', test.name)] = test;
            }
          });
        }
      } catch(e) {
        index.errors[manifestPath] = 'Unable to parse manifest: ' + e;
      }
    });
  
  self.config = config;
  self._index = index;
  
  if(callback) {
    callback();
  }
};

Constructor.prototype.extract = function(dest, stream, callback) {
  var tests = this;
  ensureDir(dest, function(err) {
    if(!err) {
      if(Constructor.debug) {
        stream.pipe(fs.createWriteStream('/tmp/test.tar.gz'));
      }
      var untar = tar.extract(dest);
      untar.on('finish', function() {
        tests.updateConfig(function() {
          callback();
        });
      });
      var extractError = function(e) {
        callback('Error while extracting package');
      };
      untar.on('error', extractError);
      var gunzip = zlib.createGunzip();
      gunzip.on('error', extractError);
      stream.pipe(gunzip).pipe(untar);
    } else {
      callback('Unable to create directory: ' + dest);
    }
  });
};

Constructor.prototype.get = function(test) {
  return this.config[test];
};

Constructor.prototype.index = function() {
  return this._index;
};

module.exports = Constructor;
