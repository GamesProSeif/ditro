const MESSAGES: { [key: string]: any } = {
	DUPLICATE_IDENTIFIER: (classToHandle: string, id: string) =>
		`Duplicate identifier "${id}" in ${classToHandle} handler`,
	ALIAS_CONFLICT: (classToHandle: string, alias: string, id1: string, id2: string) =>
		`Duplicate alias "${alias}" - id1: ${id1} - id2: ${id2}`,
	MODULE_NOT_FOUND: (classToHandle: string, id: string) =>
		`Could not find module "${id}" in "${classToHandle}" handler`,
	NOT_RELOADABLE: (classToHandle: string, id: string) =>
		`Unable to reload module "${id}" in ${classToHandle} handler`,
	NO_DIRECTORY_SPECIFIED: (classToHandle: string) =>
		`No directory specified in "${classToHandle}" handler`,
	NO_ABSTRACT_EXEC: (classToHandle: string, id: string) =>
		`You cannot invoke this function ${classToHandle}#exec - id: ${id}`,
	MISSING_PARAMETER: (classMissing: string, id: string, missing: string) =>
		`Missing parameter ${missing} in ${classMissing} - id: ${id}`,
	INVALID_TYPE: (name: string, expected: string, vowel: boolean) =>
		`Value of '${name}' was not ${vowel ? 'an' : 'a'} ${expected}`
};

export default class DitroError extends Error {
	public constructor(key: string, ...args: any[]) {
		if (MESSAGES[key] === null) throw new TypeError(`Error key '${key}' does not exist`);
		const message = typeof MESSAGES[key] === 'function'
			? MESSAGES[key](...args)
			: MESSAGES[key];

		super(message);
	}
}
