'use strict';

var grunt = require('grunt'),
    path = require('path');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports.php2html = {
    setUp: function (done) {
        // setup here if necessary
        done();
    },

    default: function (test) {
        test.expect(2);

        var actual = grunt.file.read('tmp/default/fixtures/index.html').replace(/[\s\r\n]/gm, '');
        var expected = grunt.file.read('test/expected/index-replace.html').replace(/[\s\r\n]/gm, '');
        test.equal(actual, expected, 'should show HTML content with test H1');

        actual = grunt.file.read('tmp/default/some-other-fixtures/info.html').replace(/[\s\r\n]/gm, '');
        expected = grunt.file.read('test/expected/info.html').replace(/[\s\r\n]/gm, '');
        test.equal(actual, expected, 'should show HTML content');

        test.done();
    },

    'dest-as-target': function (test) {
        test.expect(2);

        var actual = grunt.file.read('tmp/dest-as-target/index.html').replace(/[\s\r\n]/gm, '');
        var expected = grunt.file.read('test/expected/index.html').replace(/[\s\r\n]/gm, '');
        test.equal(actual, expected, 'should show HTML content with test H1');

        actual = grunt.file.read('tmp/dest-as-target/info.html').replace(/[\s\r\n]/gm, '');
        expected = grunt.file.read('test/expected/info.html').replace(/[\s\r\n]/gm, '');
        test.equal(actual, expected, 'should show HTML content');

        test.done();
    },

    'first-error': function (test) {
        test.expect(2);

        test.equal(grunt.file.exists('tmp/only-index/error.html'), false, 'file should NOT be created on error.');
        test.equal(grunt.file.exists('tmp/only-index/index.html'), true, 'index file should be created even if first processed file is gets error');

        test.done();

    },

    'first-error-nohalt': function (test) {
        test.expect(1);

        test.equal(grunt.file.exists('tmp/nohalt/error.html'), true, 'file should be created on error.');

        test.done();

    },

    'first-error-ignored': function (test) {
        test.expect(2);

        test.equal(grunt.file.exists('tmp/only-index/error-ignored.html'), true, 'file should be created when error is ignored.');

        var actual = grunt.file.read('tmp/only-index/error-ignored.html').replace(/[\s\r\n]/gm, '');
        var expected = grunt.file.read('test/expected/error-ignored.html').replace(/[\s\r\n]/gm, '');
        test.equal(actual, expected, 'it should output expected html');


        test.done();

    },

    'processTest': function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/processTest/index.html');
        var expected = ':-)';
        test.equal(actual, expected, 'should show :-)');

        test.done();

    },

    'environment': function (test) {
        var docrootfix = process.platform === 'win32' ? '\\' : '';
        test.expect(5);
        test.equal(grunt.file.read('tmp/test/env/DOCUMENT_ROOT.html'), process.cwd() + docrootfix, 'DOCUMENT_ROOT should be cwd()');
        test.equal(grunt.file.read('tmp/test/env/PHP_SELF.html'), '/test/env/PHP_SELF.php', 'PHP_SELF schould be relative script path');
        test.equal(grunt.file.read('tmp/test/env/REQUEST_URI.html'), '/test/env/REQUEST_URI.php', 'REQUEST_URI schould be relative script path');
        test.equal(grunt.file.read('tmp/test/env/SCRIPT_NAME.html'), '/test/env/SCRIPT_NAME.php', 'SCRIPT_NAME schould be relative script path');
        test.equal(grunt.file.read('tmp/test/env/SCRIPT_FILENAME.html'), path.join(process.cwd(), 'test/env/SCRIPT_FILENAME.php'), 'SCRIPT_FILENAME schould be absolute script path');
        test.done();
    },

    'getData': function (test) {
        var expected = grunt.file.read('test/expected/get.html').replace(/[\s\t\r\n]+/gm, ''),
            actual = grunt.file.read('tmp/data/get.html').replace(/[\s\t\r\n]+/gm, '');

        test.expect(1);
        test.equal(actual, expected, 'Should output data from query string');
        test.done();
    },

    'router': function (test) {
        var expected = '/myroute';
        var actual = grunt.file.read('tmp/router/myroute.html').replace(/[\s\t\r\n]+/gm, '');
        test.expect(1);
        test.equal(actual, expected, 'Should output request uri passed to router');
        test.done();
    }
};
