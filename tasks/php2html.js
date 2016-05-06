/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';



module.exports = function (grunt) {

    var _ = require('lodash'),
        shjs = require("shelljs"),
        path = require('path'),
        php2html = require('php2html').default,
        HTMLHint = require("htmlhint").HTMLHint,
        compiled = [];


    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('php2html', 'Generate HTML from PHP', function () {

        var cb = this.async(),
            targetDirectory,
            options = this.options({
                process: false,
                htmlhint: undefined,
                docroot: undefined,
                haltOnError: true
            });

        // nothing to do
        if (this.files.length < 1) {
            grunt.log.warn('Destination not written because no source files were provided.');
            return;
        }

        // read config file for htmlhint if available
        if (options.htmlhintrc) {
            if (options.htmlhintrc === true) {
                options.htmlhintrc = findFile('.htmlhintrc', process.cwd());
            }

            try {
                var rc = grunt.file.readJSON(options.htmlhintrc);
                grunt.util._.defaults(options.htmlhint, rc);
            } catch (err) {
                grunt.log.error('.htmlhintrc not found!');
            }
            delete options.htmlhintrc;
        }

        // set to undefined to use default params when value is true
        if (options.htmlhint === true) {
            options.htmlhint = undefined;
        }

        // set empty object to false to keep backwards compatibility
        if (_.isObject(options.htmlhint) && Object.keys(options.htmlhint).length === 0) {
            options.htmlhint = false;
        }

        //// $_GET data
        //if (typeof options.getData !== 'undefined') {
        //    queryString = qs.stringify(options.getData);
        //}

        // Loop files array
        grunt.util.async.forEachSeries(this.files, function (f, nextFileObj) {
            // try to get docroot
            // first: docroot from options
            // third: use process cwd
            var docroot = path.normalize(options.docroot || f.orig.cwd || process.cwd());

            // check docroot
            if (!grunt.file.exists(docroot)) {
                grunt.log.warn('Docroot "' + docroot + '" does not exist');
                return nextFileObj();
            }

            // absolutize docroot
            if (!grunt.file.isPathAbsolute(docroot)) {
                docroot = path.normalize(path.join(process.cwd(), docroot));
            }

            // remove trailing slash
            docroot = docroot.replace(/\/$/, '');

            // Warn on and remove invalid source files (if null was set).
            var files = f.src.filter(function (filepath) {
                if (!grunt.file.exists(filepath) && !options.router) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            // add routes
            });

            if (options.router) {
                files = files.concat(f.orig.src.filter(function (filepath) {
                    return !/(^!)|(\*)/.test(filepath);
                }));
            }

            // check files
            if (files.length === 0) {
                grunt.log.warn('Destination not written because no source files were found.');

                // No src files, goto next target. Warn would have been issued above.
                return nextFileObj();
            }

            // check if dest is directory
            if (detectDestType(f.dest) === 'directory') {
                targetDirectory = path.normalize(f.dest);
            } else {
                targetDirectory = path.dirname(f.dest);
            }

            // make shure dest directory exists
            if (!grunt.file.isDir(targetDirectory)) {
                grunt.file.mkdir(targetDirectory);
            }

            grunt.util.async.concatSeries(_.uniq(files), function (file, next) {

                // compute target filename
                var target;
                if (detectDestType(f.dest) === 'directory') {
                    target = path.join(targetDirectory, path.basename(file, '.php') + '.html');
                } else {
                    target = path.join(targetDirectory, path.basename(f.dest));
                }

                grunt.log.debug('----------------------------------');
                grunt.log.debug('docroot: ', docroot);
                grunt.log.debug('target', target);
                grunt.log.debug('----------------------------------');
                grunt.log.write('Processing ' + file + '...');

                php2html(file, _.assign(options,{baseDir:docroot}), function (error, response) {


                    // does the last part of the job
                    var finish = function (target, response, cb) {
                        var messages = [],
                            empty = typeof response === 'undefined' || response === '';


                        // Lint generated html and check if response is  empty
                        if (options.htmlhint !== false) {
                            messages = HTMLHint.verify(response || '', options.htmlhint);
                        }

                        // move on to the next file if everything went right
                        if (!error && messages.length === 0 && !empty) {
                            grunt.file.write(target, response);
                            grunt.log.ok();
                            grunt.log.debug(target + ' written');
                            compiled.push(target);

                            // there was an error, show messages to the user if applicable and move on
                        } else {
                            grunt.log.error();

                            if (empty) {
                                grunt.log.warn('Resulting HTML is empty');
                            }

                            if (!options.haltOnError) {
                                try {
                                    grunt.file.write(target, response);
                                } catch (err) {
                                    grunt.log.error(err);
                                }
                            }

                            // output messages
                            messages.forEach(function (message) {
                                grunt.log.writeln("[".red + ( "L" + message.line ).yellow + ":".red + ( "C" + message.col ).yellow + "]".red + ' ' + message.message.yellow);
                            });
                        }

                        cb();
                    };

                    // processOutput function
                    if (options.process && typeof options.process === 'function') {
                        options.process(response, function callback(modified) {
                            finish(target, modified, next);
                        });
                    } else {
                        finish(target, response, next);
                    }

                });
            }, function () {
                grunt.log.debug('done');
                nextFileObj();
            });

        }, cb);
    });



    /**
     * Get type of destination path
     * @param {string} dest
     * @returns {string} directory|file
     */
    var detectDestType = function (dest) {
        if (grunt.util._.endsWith(dest, '/') || grunt.util._.endsWith(dest, '\\')) {
            return 'directory';
        } else {
            return 'file';
        }
    };



    // Storage for memoized results from find file
    // Should prevent lots of directory traversal &
    // lookups when liniting an entire project
    var findFileResults = {};

    /**
     * Searches for a file with a specified name starting with
     * 'dir' and going all the way up either until it finds the file
     * or hits the root.
     *
     * copied from
     * https://github.com/jshint/jshint/blob/master/src/cli.js
     *
     * @param {string} name filename to search for (e.g. .jshintrc)
     * @param {string} dir  directory to start search from (default:
     *                      current working directory)
     *
     * @returns {string} normalized filename
     */
    function findFile(name, dir) {
        dir = dir || process.cwd();

        var filename = path.normalize(path.join(dir, name));
        if (findFileResults[filename] !== undefined) {
            return findFileResults[filename];
        }

        var parent = path.resolve(dir, "../");

        if (shjs.test("-e", filename)) {
            findFileResults[filename] = filename;
            return filename;
        }

        if (dir === parent) {
            findFileResults[filename] = null;
            return null;
        }

        return findFile(name, parent);
    }


};
