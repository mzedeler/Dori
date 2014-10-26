'use strict';

var spawn = require('child_process').spawn,
    dirname = require('path').dirname,
    glob = require('glob'),
    fs = require('fs');

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

Constructor.prototype.get = function(test) {
  return this.config[test];
};

Constructor.prototype.index = function() {
  return this._index;
};

module.exports = Constructor;
