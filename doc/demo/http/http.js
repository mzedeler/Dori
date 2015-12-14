#!node

'use strict';

var http = require('http');

var req = http.request(process.argv[2], function(res) {
  console.log(res.statusCode);
  res.on('data', function(chunk) {
    console.log(chunk.toString());
  });
  res.on('end', function() {
    process.exit(res.statusCode < 400 ? 0 : 1);
  });
});

req.on('error', function(e) {
  console.log(e);
  process.exit(2);
});

req.end();

