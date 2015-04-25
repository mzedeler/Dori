'use strict';
/* global describe, it */

var assert = require('chai').assert;
var request = require('supertest');

var Server = require('../server.js');
var tmpServer = require('./tmp-server.fixture.js');

describe('Initialization', function() {
  it('Should be possible to initialize Server', function() {
    assert.isFunction(Server, 'Require Server returns a function');
    var server = new Server();
    assert.isFunction(server, 'Call to Server constructor returns function.');
  });
});

describe('Serving', function() {

  describe('Listing tests', function() {
    it('Serves JSON and returns status code 200 on /tests/', function(done) {
      var app = new Server();
      request(app)
        .get('/tests/')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
    it('Serves JSON and returns status code 200 on /tests (no trailing slash)', function(done) {
      var app = new Server();
      request(app)
        .get('/tests')
        .expect('Content-Type', /json/)
        .expect(200, done);
    });
    it('Lists the right test fixtures', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/')
        .end(function(err, res) {
          assert.sameMembers(
            [
              '/tests/somedir1/ok.simpletest.js',
              '/tests/somedir1/error.simpletest.js',
              '/tests/somedir1/somedir2/ok.simpletest.js'
            ],
            Object.keys(res.body.tests),
            'Just three specific test scripts'
          );
          done();
        });
    });
  });
  
  describe('Running tests', function() {
    it('Runs an ok test and returns status code 200', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/ok.simpletest.js')
        .expect(200, done);
    });
    it('Runs a failing test and returns status code 525', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/error.simpletest.js')
        .expect(525, done);
    });
    it('Returns output written to stdout and stderr', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/somedir1/ok.simpletest.js')
        .expect(/writing to stdout/)
        .expect(/writing to stderr/)
        .expect(200, done);
    });

  });

  describe('Installing tests', function() {
    it('Is possible to upload a test package');
    it('Runs install script in test manifest');
  });
  
  describe('Error handling', function() {
    it('Returns status 404 for non-existing tests', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/tests/-nonexisting-')
        .expect(404, done);
    });
    it('Returns status 404 for requests outside mount point', function(done) {
      var app = new Server('fixtures');
      request(app)
        .get('/')
        .expect(404, done);
    });
    it('Handles errors when trying to remove directories gracefully', function(done) {
      var sinon = require('sinon');
      var shell = require('shelljs');
      var uploader = require('../uploader.js');
      sinon.stub(shell, 'rm', function() {
        shell.rm.restore();
        sinon.stub(shell, 'error', function() {
          shell.error.restore();
          return 'stub error';
        });
      });
      tmpServer('abc', function(app) {
        var server = app.listen(0, function() {
          app.on('dori:configUpdated', function() {
            done();
          });
          uploader(
            'fixtures/somedir1',
            'http://localhost:' + server.address().port + '/tests/tmp/',
            'abc',
            function(error) {
               assert(error, 'Uploader aborts with error (got ' + error + ')');
            }
          );
        });
      });
    });
    it('Returns status 409 on the second run of an already running test');
    it('Returns status 500 if an invalid test package is uploaded');
    it('Returns status 500 if a test package with a test manifest that contains errors');
  });
  
});
