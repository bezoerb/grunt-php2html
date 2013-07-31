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

	globbing: function (test) {
		test.expect(2);

		var actual = grunt.file.read('tmp/globbing/fixtures/index.html').length;
		var expected = grunt.file.read('test/expected/index.html').length;
		test.equal(actual, expected, 'should show HTML content with test H1');

		actual = grunt.file.read('tmp/globbing/fixtures2/info.html').length;
		expected = grunt.file.read('test/expected/info.html').length;
		test.equal(actual, expected, 'should show HTML content from phpinfo()');

		test.done();
	},

	'dest-as-target': function (test) {
		test.expect(2);

		var actual = grunt.file.read('tmp/dest-as-target/index.html').length;
		var expected = grunt.file.read('test/expected/index.html').length;
		test.equal(actual, expected, 'should show HTML content with test H1');

		actual = grunt.file.read('tmp/dest-as-target/info.html').length;
		expected = grunt.file.read('test/expected/info.html').length;
		test.equal(actual, expected, 'should show HTML content from phpinfo()');

		test.done();
	}
};
