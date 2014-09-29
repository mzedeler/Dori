'use strict';

process.stdout.write(__filename + "\r\n", function() {
  process.stdout.write("writing to stdout\r\n", function() {
    process.stderr.write("writing to stderr\r\n", function() {
      process.exit(1);
    });
  });
});
