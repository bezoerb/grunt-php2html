/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

	// show elapsed time at the end
	require('time-grunt')(grunt);
	// load all grunt tasks
	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/**/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

        php2htmlclean: { all: { } },

		// Configuration to be run (and then tested).
		php2html: {
			default: {
				options: {
					// relative links should be renamed from .php to .html
					processLinks: true,
					htmlhint: false,
				},
				files: [
					{
                        expand: true,
                        cwd: 'test/',
                        src: ['**/*.php', '!fixtures/error.php', '!env/*.php'],
                        dest: 'tmp/default',
                        ext: '.html'
                    }
				]
			},

			'dest-as-target': {
				options: {
					processLinks: false,
					htmlhint: false,
					docroot: 'test'
				},
				files: {
					'tmp/dest-as-target/': ['test/some-other-fixtures/info.php','test/fixtures/index.php']
				}
			},

			'first-error': {
				options: {
					processLinks: false,
					htmlhint: {
						'tag-pair': true
					}
				},
				files: {
					'tmp/only-index/': ['test/fixtures/error.php','test/fixtures/index.php']
				}
			},

            'first-error-nohalt': {
                options: {
                    processLinks: false,
                    htmlhint: {
                        'tag-pair': true
                    },
                    haltOnError: false
                },
                files: {
                    'tmp/nohalt/': ['test/fixtures/error.php']
                }
            },

            'first-error-ignored': {
              options: {
                  processLinks: false,
                  htmlhint: {
                      'tag-pair': false
                  }
              },
              src: 'test/fixtures/error.php',
              dest: 'tmp/only-index/error-ignored.html'
            },

			'environment': {
				options: {
					htmlhint: false,
				},
				files: [
					{expand: true, cwd: './', src: ['test/env/*.php'], dest: 'tmp/', ext: '.html' }
				]

			},

			'processTest': {
				options: {
					processLinks: false,
					htmlhint: false,
					process: function(response,callback) {
						callback(':-)');
					}
				},
				files: {
					'tmp/processTest/': ['test/fixtures/index.php']
				}
			},

            'getData': {
                options: {
                    htmlhint: false,
                    getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}
                },
                files: {
                    'tmp/data/': ['test/fixtures/get.php']
                }
            }
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}

	});


	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean','php2html','nodeunit'/*, 'clean'*/]);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
