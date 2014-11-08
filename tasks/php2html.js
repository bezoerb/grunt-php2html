/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    qs = require('qs'),
    shjs = require("shelljs"),
    win32 = process.platform === 'win32';

module.exports = function (grunt) {

    var path = require('path'),
        http = require('http'),
        HTMLHint = require("htmlhint").HTMLHint,
        request = require('request'),
        gateway = require('gateway'),
        compiled = [],
        app, middleware;

    // unlink generated html files
    // usefull if the files get copied and processed later
    grunt.registerMultiTask('php2htmlUnlink', 'Unlink generated HTML', function () {
        grunt.log.ok('removing generated files...');
        compiled.forEach(function (file) {
            fs.unlink(file, function (err) {
                if (err) {
                    grunt.log.warn(err);
                }
            });

        });
    });


    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('php2html', 'Generate HTML from PHP', function () {

        var cb = this.async(),
            targetDirectory,
            queryString = '',
            options = this.options({
                processLinks: true,
                process: false,
                htmlhint: undefined,
                docroot: undefined,
                serverPort: 8888,
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

        // $_GET data
        if (typeof options.getData !== 'undefined') {
            queryString = qs.stringify(options.getData);
        }

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

            // Warn on and remove invalid source files (if nnull was set).
            var files = f.src.filter(function (filepath) {
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            });

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

            grunt.util.async.concatSeries(files, function (file, next) {
                var target, uri = computeUri(docroot, file);

                // check if uri exists
                if (!grunt.file.exists(path.join(docroot, uri))) {
                    grunt.log.warn('Source file not found: ', uri);
                    return;
                }

                // compute target filename
                if (detectDestType(f.dest) === 'directory') {
                    target = path.join(targetDirectory, path.basename(uri, '.php') + '.html');
                } else {
                    target = path.join(targetDirectory, path.basename(f.dest));
                }

                grunt.log.debug('----------------------------------');
                grunt.log.debug('docroot: ', docroot);
                grunt.log.debug('uri', uri);
                grunt.log.debug('target', target);
                grunt.log.debug('----------------------------------');

                // start server
                middleware = gateway(docroot, {
                    '.php': 'php-cgi'
                });

                // start server with php middleware
                app = http.createServer(function (req, res) {
                    // Pass the request to gateway middleware
                    middleware(req, res, function (err) {
                        grunt.log.warn(err);
                        res.writeHead(204, err);
                        res.end();
                    });
                });

                grunt.log.write('Processing ' + file + '...');


                compilePhp(options.serverPort, uri, queryString, function (response, err) {

                    // replace relative php links with corresponding html link
                    if (response && options.processLinks) {
                        _.forEach(response.match(/href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm), function (link) {
                            if (link.match(/:\/\//)) {
                                return;
                            }
                            var hlink = link.replace(/(\w)\.php([^\w])/g, '$1.html$2');
                            response = response.replace(link, hlink);
                        });
                    }

                    // doeas the last part of the job
                    var finish = function (target, response, cb) {
                        var messages = [],
                            empty = typeof response === 'undefined' || response === '';


                        // Lint generated html and check if response is  empty
                        if (options.htmlhint !== false) {
                            messages = HTMLHint.verify(response || '', options.htmlhint);
                        }

                        // move on to the next file if everything went right
                        if (!err && messages.length === 0 && !empty) {
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
                                var evidence = message.evidence,
                                    col = message.col;
                                if (col === 0) {
                                    evidence = '?'.inverse.red + evidence;
                                } else if (col > evidence.length) {
                                    evidence = evidence + ' '.inverse.red;
                                } else {
                                    evidence = evidence.slice(0, col - 1) + evidence[col - 1].inverse.red + evidence.slice(col);
                                }

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
     * Use server with gateway middleware to generate html for the given source
     * @param {int} port
     * @param {string} uri
     * @param {function} callback
     */
    var compilePhp = function (port, uri, query, callback) {
        var url = 'http://localhost:' + port + uri;

        // append query string to url
        if (query) {
            url += '?' + query;
        }

        app.listen(port);

        // start request
        request(url, function (error, response, body) {
            app.close();
            callback(body, error);
        }).end();
    };

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


    /**
     * Compute URI for gateway relative to docroot
     * @param {string} docroot
     * @param {sting} file
     * @returns {string}
     */
    var computeUri = function (docroot, file) {
        var uri;
        // If file ends with a slash apend index file
        if (file[file.length - 1] === '/' || grunt.file.isDir(file)) {
            file = path.join(file, 'index.php');
        }

        // absolutize filepath
        if (!grunt.file.isPathAbsolute(path.dirname(file))) {
            file = path.join(process.cwd(), file);
        }

        if (win32) {
            // use the correct slashes for uri
            uri = file.replace(docroot, '').replace(/[\\]/g, '/');
        } else {
            uri = file.replace(docroot, '');
        }

        // ensure that we have an absolute url
        if (uri.substr(0, 1) !== '/') {
            uri = '/' + uri;
        }

        return uri;
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
