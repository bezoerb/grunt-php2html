/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

// External libs.
var exec = require('child_process').exec;

exports.init = function(grunt) {


  /**
   * Runs php command with options
   *
   * @param String command
   * @param Function callback
   * @param Object config
   */
  exports.run = function(command, callback, config) {

    var term = exec(command, function(err, stdout, stderr) {

      if (stdout && !config.followOutput) {
        grunt.log.write(stdout);
      }

      if (err) {
        grunt.fatal(err);
      }
      callback();
    });

    if (config.followOutput) {
      term.stdout.on('data', function(data) {
        grunt.log.write(data);
      });
    }
  };

  return exports;
};