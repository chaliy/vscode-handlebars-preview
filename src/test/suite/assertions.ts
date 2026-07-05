export function equal(actual: unknown, expected: unknown, message?: string): void {
	if (actual !== expected) {
		throw new Error(message ?? `Expected ${String(actual)} to equal ${String(expected)}`);
	}
}

export function ok(value: unknown, message?: string): asserts value {
	if (!value) {
		throw new Error(message ?? `Expected ${String(value)} to be truthy`);
	}
}

export function match(value: string, pattern: RegExp, message?: string): void {
	if (!pattern.test(value)) {
		throw new Error(message ?? `Expected ${value} to match ${pattern}`);
	}
}

export function doesNotMatch(value: string, pattern: RegExp, message?: string): void {
	if (pattern.test(value)) {
		throw new Error(message ?? `Expected ${value} not to match ${pattern}`);
	}
}
