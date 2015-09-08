'use strict';

/* global after */

var tmp = require('tmp'),
    shelljs = require('shelljs'),
    rm = shelljs.rm,
    cp = shelljs.cp,
    Server = require('../server.js'),
    Tests = require('../tests.js');

var tmpDirs = [];

after(function() {
  tmpDirs.forEach(function(dir) {
    rm('-r', dir);
  });
});


function tmpIfy(callback) {
  tmp.dir(
    {
      unsafeCleanup: true,
    },
    function(err, dir) {
      if (!err) {
        tmpDirs.push(dir);

        cp('-r', 'fixtures', dir);
        callback(dir);
      } else {
        throw err;
      }
    }
  );
}

module.exports = {
  Server: function(uploadKey, callback) {
    return tmpIfy(function(dir) {
      callback(new Server(dir, uploadKey));
    });
  },
  Tests: function(mount, callback) {
    return tmpIfy(function(dir) {
      callback(new Tests(dir, mount));
    });
  }
};

