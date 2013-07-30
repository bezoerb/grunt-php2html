/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

// External libs.
var path = require('path');

exports.init = function(grunt) {

  var exports   = {},
      _         = grunt.util._,
      directory = null,
      config    = {};

  /**
   * @var object default values
   */
  var defaults = {
    bin: 'php'
  };

  /**
   * @var Object containing flag options
   */
  var flags = {

  };

  /**
   * @var Array contains file options
   */
  var files = [
  ];

  /**
   * @var Object containing valued options
   */
  var valued = {
  };

  /**
   * Builds flag options
   *
   * @return array
   */
  var buildFlagOptions = function() {

    var options = [];

    _.each(flags, function(value, key) {
      if(grunt.option(key) || grunt.option(value) ||  config[key] === true) {
        options.push('--' + value);
      }
    });
    return options;
  };

  /**
   * Builds file options
   *
   * @return array
   */
  var buildFileOptions = function() {

    var options = [];

    _.each(files, function(file) {

      if(!config[file]) {
        return;
      }
      if (grunt.file.exists(directory + config[file])) {
        options.push('--'+ file + ' ' + directory + config[file]);
      } else {
        options.push('--'+ file + ' ' + config[file]);
      }
    });
    return options;
  };

  /**
   * Builds valued options
   *
   * @return array
   */
  var buildValuedOptions = function() {

    var options = [];

    _.each(valued, function(value, key) {
      if(config[key]) {
        options.push('--'+value+' '+config[key]);
      }
    });
    return options;
  };

  /**
   * Builds phpunit command
   *
   * @return string
   */
  var buildOptions = function() {

    var options = [].concat(
      buildFlagOptions(),
      buildFileOptions(),
      buildValuedOptions()
    );
    return options.join(' ');
  };

  /**
   * Returns the command to be run
   *
   */
  var command = function() {
    return path.normalize(config.bin);
  };

  /**
   * Returns the directory that phpunit will be run from
   *
   * @return string
   */
  exports.directory = function() {
    return directory;
  };

  /**
   * Setup task before running it
   *
   * @param Object runner
   */
  exports.build = function(dir, options) {
    directory = path.normalize(dir);
    config    = options(defaults);

    return command() + ' ' + buildOptions() + ' ' + directory;
  };

  /**
   * Returns the phpunit config object
   *
   * @return string
   */
  exports.config = function() {
    return config;
  }

  return exports;
};