/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

	// Make an empty dir for testing as git doesn't track empty folders.
	//grunt.file.mkdir('test/fixtures/empty_folder');
	//grunt.file.mkdir('test/expected/copy_test_mix/empty_folder');

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

		// Configuration to be run (and then tested).
		php2html: {
			globbing: {
				files: [
					{expand: true, cwd: 'test/', src: ['**/*.php'], dest: 'tmp/globbing', ext: '.html' }
				]
			},

			'dest-as-target': {
				files: {
					'tmp/dest-as-target/': ['test/fixtures2/info.php','test/fixtures/index.php']
				}
			}



			/*,


			default_options: {
				options: {
				},
				files: {
					'tmp/default_options': ['test/fixtures/*.php', 'test/fixtures/123']
				}
			},
			custom_options: {
				options: {
					separator: ': ',
					punctuation: ' !!!'
				},
				files: {
					'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']
				}
			}*/
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'php2html', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
