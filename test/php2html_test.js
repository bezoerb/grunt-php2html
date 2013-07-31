'use strict';

var grunt = require('grunt');

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

		var actual = grunt.file.read('tmp/default/fixtures/index.html').replace(/[\s\r\n]/gm,'');
		var expected = grunt.file.read('test/expected/index-replace.html').replace(/[\s\r\n]/gm,'');
		test.equal(actual, expected, 'should show HTML content with test H1');

		actual = grunt.file.read('tmp/default/some-other-fixtures/info.html').replace(/[\s\r\n]/gm,'');
		expected = grunt.file.read('test/expected/info.html').replace(/[\s\r\n]/gm,'');
		test.equal(actual, expected, 'should show HTML content');

		test.done();
	},

	'dest-as-target': function (test) {
		test.expect(2);

		var actual = grunt.file.read('tmp/dest-as-target/index.html').replace(/[\s\r\n]/gm,'');
		var expected = grunt.file.read('test/expected/index.html').replace(/[\s\r\n]/gm,'');
		test.equal(actual, expected, 'should show HTML content with test H1');

		actual = grunt.file.read('tmp/dest-as-target/info.html').replace(/[\s\r\n]/gm,'');
		expected = grunt.file.read('test/expected/info.html').replace(/[\s\r\n]/gm,'');
		test.equal(actual, expected, 'should show HTML content');

		test.done();
	},

	'processTest': function (test) {
		test.expect(1);

		var actual = grunt.file.read('tmp/processTest/index.html');
		var expected = ':-)';
		test.equal(actual, expected, 'should show :-)');

		test.done();

	}
};
