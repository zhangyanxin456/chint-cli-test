'use strict';

module.exports = exec;

function exec() {
  console.log('Hello from exec', process.env);
  return 'Hello from exec';
}
