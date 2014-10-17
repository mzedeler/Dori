'use strict';
/* global describe, it, before, after */

var assert = require('chai').assert,
    request = require('supertest'),
    rm = require('shelljs').rm,
    cp = require('shelljs').cp,
    tmp = require('tmp'),
    Server = require('../server.js'),
    uploader = require('../uploader.js');

describe('Uploader', function() {
  
  describe('Initialization', function() {
    it('Should be possible to import uploader', function(done) {
      assert.isFunction(uploader, 'Require uploader returns a function');
      done();
    });
  });
  
  describe('Uploading', function() {
  
    // module.exports = function(path, serverUrl, key, callback) {
    
    var serverRoot;
    before(function(done) {
      tmp.dir(
        { unsafeCleanup: true },
        function(err, path) {
          if(!err) {
            serverRoot = path;
            cp('-r', 'fixtures', serverRoot);
          }
          done();
        }
      );
    });
    
    after(function() { rm('-r', serverRoot); });
    
    describe('Uploading tests', function() {
      it('Is possible to upload fixtures', function(done) {
        var app = new Server(serverRoot, 'abc');
        var server = app.listen(0, function() {
          app.on('dori:configUpdated', function() { done(); });
          uploader(
            'fixtures/somedir1',
            'http://localhost:' + server.address().port + '/tests/tmp/',
            'abc',
            function(error) {
              assert(!error, 'Uploader finishes without error (got ' + error + ')');
            }
          );
        });
      });
      it('Lists the fixtures that were just uploaded', function(done) {
        var app = new Server(serverRoot);
        request(app)
          .get('/tests/')
          .end(function(err, res) {
            ['/tests/tmp/ok.simpletest.js',
             '/tests/tmp/error.simpletest.js',
             '/tests/tmp/somedir2/ok.simpletest.js'].forEach(function(url) {
               assert(res.body.tests[url], 'The url ' + url + ' must be present in the test list');
             });
            done();
          });
      });
    });
  });

});
