'use strict';
/* global describe, it */

var assert = require('chai').assert;

var Tests = require('../tests.js');

describe('Initialization', function() {
  it('Should be possible to initialize Tests', function() {
    assert.isFunction(Tests, 'Require Tests returns a function');
    var tests = new Tests('some_path', 'some_mount');
    assert.isObject(tests, 'Call to Tests constructor returns object.');
    assert.equal(tests.path, 'some_path', 'Path has been set correctly.');
    assert.equal(tests.mount, 'some_mount', 'Mount has been set correctly.');
  });
});

describe('Configuring and running tests', function() {
  it('Should be possible to add directory with tests', function() {
    var tests = new Tests('fixtures', '/tests');
    ['/tests/somedir1/ok.simpletest.js',
     '/tests/somedir1/error.simpletest.js',
     '/tests/somedir1/somedir2/ok.simpletest.js'].forEach(function(url) {
       assert(tests.index().tests[url], 'The url ' + url + ' must be present in the test list');
     });
    assert.equal(Object.keys(tests.index().tests).length, 3, 'Just three test scripts');
  });
  
});
