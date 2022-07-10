import * as assert from 'assert';

import * as extension from "../../extension";

suite('extension', () => {
	test('activation', () => {
		assert.ok(extension.activate);
	});
});
