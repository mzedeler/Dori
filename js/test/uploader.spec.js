'use strict';
/* global describe, it, before, after */

var assert = require('chai').assert,
    request = require('supertest'),
    rm = require('shelljs').rm,
    cp = require('shelljs').cp,
    tmp = require('tmp'),
    tmpServer = require('./tmp-classes.fixture.js').Server,
    uploader = require('../uploader.js');

describe('Uploader', function() {

  describe('Initialization', function() {
    it('Should be possible to import uploader', function(done) {
      assert.isFunction(uploader, 'Require uploader returns a function');
      done();
    });
  });

  describe('Uploading', function() {
    function uploadTest(app, done, url, uploadKey) {
      var server = app.listen(0, function() {
        app.on('dori:configUpdated', function() {
          done();
        });

        uploader(
          url,
          'http://localhost:' + server.address().port + '/tests/tmp/',
          uploadKey,
          function(error) {
            assert(!error, 'Uploader finishes without error (got ' + error + ')');
          }
        );
      });
    }

    describe('Uploading set with three tests', function() {
      var app;
      var uploadKey = 'abc';
      tmpServer(uploadKey, function(_app) {
        app = _app;
      });

      it('Is possible to upload fixtures', function(done) {
        uploadTest(app, done, 'fixtures/somedir1', uploadKey);
      });

      it('Lists the fixtures that were just uploaded', function(done) {
        request(app)
          .get('/tests/')
          .end(function(err, res) {
            [
              '/tests/tmp/ok.simpletest.js',
              '/tests/tmp/error.simpletest.js',
              '/tests/tmp/somedir2/ok.simpletest.js'
            ].forEach(function(url) {
              assert(res.body.tests[url], 'The url ' + url + ' must be present in the test list');
            });

            done();
          });
      });
    });

    describe('Uploading manitest without install instructions', function() {
      var uploadKey = 'cba';

      it('Is possible to upload fixture without install', function(done) {
        tmpServer(uploadKey, function(app) {
          uploadTest(app, done, 'fixtures/somedir5', uploadKey);
        });
      });
    });
  });

});
