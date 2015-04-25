'use strict';

var spawn = require('child_process').spawn,
    dirname = require('path').dirname,
    glob = require('glob'),
    ensureDir = require('fs-extra').ensureDir,
    fs = require('fs'),
    shell = require('shelljs'),
    join = require('path').join,
    execFile = require('child_process').execFile,
    exists = require('fs').exists,
    archive = require('./archive.js');

var Constructor = function(path, mount) {
  this.path = path;
  this.mount = mount;
  this._index = {
    tests: {},
    errors: {}
  };
  this.config = {};
  var self = this;
  glob.sync(self.path + '/**/test.manifest')
    .forEach(function(manifestPath) {
      self.parseManifest(manifestPath);
    });
};

Constructor.prototype.parseManifest = function(manifestPath, callback) {
  var self = this;
  var manifest;
  if(!callback) {
    callback = function() {};
  }
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath));
  } catch(e) {
    self._index.errors[manifestPath] = 'Unable to parse manifest: ' + e;
    callback('Unable to parse manifest: ' + e, '', '');
    return;
  }
  if(manifest.tests) {
    var baseUrl = dirname(manifestPath).substr(self.path.length);
    var workDir = dirname(manifestPath);
    manifest.tests.forEach(function(test) {
      if(test.command) {
        self._index.tests[self.mount.concat(baseUrl, '/', test.name)] = {};
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
        self.config[baseUrl.concat('/', test.name)] = test;
      }
    });
  }
  if(manifest.install) {
    execFile(
      manifest.install.command,
      manifest.install.args,
      {},
      callback
    );
  }
};

Constructor.prototype.extract = function(relDest, stream, callback) {
  var join = require('path').join;
  var dest = join(this.path, relDest);
  console.log(this.path);
  console.log(relDest);
  console.log(dest);
  var tests = this;
  var cleanupStack = [];
  function errorHandler(err) {
    cleanupStack.forEach(function(handler) {
      handler();
    });
    // TODO: Remove the tests anchored at dest
    callback(err);
  }
  // shell.rm('-rf', dest);
  console.log('rm -rf ' + dest);
  var err = shell.error();
  if(!err) {
    ensureDir(dest, function(err) {
      if(!err) {
        // cleanupStack.push(function() { shell.rm('-rf', dest); });
  console.log('rm -rf ' + dest);
        if(Constructor.debug) {
          stream.pipe(fs.createWriteStream('/tmp/test.tar.gz'));
        }
        archive.unpack(stream, dest, function(err) {
          if(err) {
            callback(err);
          } else {
            tests.parseManifest(join(dest, 'test.manifest'), callback);
          }
        });
      } else {
        errorHandler('Unable to create directory: ' + dest);
      }
    });
  } else {
    errorHandler('Unable to remove directory: ' + dest + ' (' + err + ')');
  }
};

Constructor.prototype.get = function(test) {
  return this.config[test];
};

Constructor.prototype.index = function() {
  return this._index;
};

module.exports = Constructor;

