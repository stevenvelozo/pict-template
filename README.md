# Pict Template

The base class for Pict template expressions. Extend this class to create custom template tags that are resolved by the Pict template engine. Register start/end pattern markers, override the `render` method, and your template expression is available in any Pict template string.

[![Build Status](https://github.com/stevenvelozo/pict-template/workflows/Pict-Template/badge.svg)](https://github.com/stevenvelozo/pict-template/actions)
[![npm version](https://badge.fury.io/js/pict-template.svg)](https://badge.fury.io/js/pict-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **Custom Template Expressions** - Define your own template tags with any start/end pattern markers
- **Pattern Trie Matching** - Patterns are registered in Pict's [Precedent](https://github.com/stevenvelozo/precedent) word tree for efficient multi-pattern parsing
- **State Resolution** - Built-in `resolveStateFromAddress` for dot-notation lookups across Record, Context, Scope, and custom root objects
- **Sync and Async** - Both `render` and `renderAsync` variants for synchronous and callback-based rendering
- **TypeScript Definitions** - Ships with `.d.ts` type definitions
- **Service Provider Pattern** - Extends `fable-serviceproviderbase` and registers with a Pict instance via dependency injection

## Installation

```bash
npm install pict-template
```

## Quick Start

Create a custom template expression by extending `PictTemplate` and overriding `render`:

```javascript
const libPictTemplate = require('pict-template');

class UpperCaseTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Register the pattern markers: {UP: ... :UP}
		this.addPattern('{UP:', ':UP}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash, pRecord, pContextArray, null, pScope);
		return (typeof tmpValue === 'string') ? tmpValue.toUpperCase() : '';
	}
}

// Register with Pict
const libPict = require('pict');
let _Pict = new libPict();
_Pict.addTemplate(UpperCaseTemplate);

// Use in a template string
let result = _Pict.parseTemplate('Hello, {UP:Record.Name:UP}!', { Name: 'world' });
// => "Hello, WORLD!"
```

## How It Works

1. Your subclass calls `this.addPattern(startTag, endTag)` in the constructor to register pattern markers with Pict's template engine
2. When `pict.parseTemplate()` encounters your markers in a string, it extracts the content between them (the "template hash") and calls your `render` method
3. Your `render` method receives the hash, the data record, context array, scope, and state — and returns a string replacement

## API

### `render(pTemplateHash, pRecord, pContextArray, pScope, pState)`

Override this method to implement your template expression logic. Returns a string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pTemplateHash` | `String` | The content between the start and end pattern markers |
| `pRecord` | `Object` | The data record passed to `parseTemplate` |
| `pContextArray` | `Array` | Array of context objects accessible via `Context[N]` |
| `pScope` | `Object` | Sticky scope for carrying state across template expressions |
| `pState` | `Object` | Catchall state object for plumbing data through processing |

### `renderAsync(pTemplateHash, pRecord, fCallback, pContextArray, pScope, pState)`

Async variant of `render`. The default implementation calls `render` and passes the result to the callback. Override for truly asynchronous rendering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `fCallback` | `Function` | Callback receiving `(error, renderedString)` |

### `addPattern(pMatchStart, pMatchEnd)`

Register start and end pattern markers with Pict's template trie. Call this in your constructor.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMatchStart` | `String` | The opening pattern marker (e.g. `'{UP:'`) |
| `pMatchEnd` | `String` | The closing pattern marker (e.g. `':UP}'`) |

### `resolveStateFromAddress(pAddress, pRecord, pContextArray, pRootDataObject, pScope, pState)`

Resolve a value from nested objects using dot-notation. Delegates to Pict's state resolver.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pAddress` | `String` | Dot-notation path (e.g. `'Record.Name'`, `'Context[0].Data'`, `'Scope.UserValue'`) |
| `pRecord` | `Object` | The data record |
| `pContextArray` | `Array` | Context objects array |
| `pRootDataObject` | `Object` | Optional custom root data object for address resolution |
| `pScope` | `Object` | Scope object |
| `pState` | `Object` | State object |

Returns the resolved value or `undefined`.

## Address Resolution

The `resolveStateFromAddress` method supports these address prefixes:

| Prefix | Resolves From |
|--------|---------------|
| `Record.` | The `pRecord` data object |
| `Context[N].` | The Nth element of the `pContextArray` |
| `Scope.` | The `pScope` object |
| *(custom)* | The `pRootDataObject` if provided |

## Part of the Retold Framework

Pict Template is the base class for all template expressions in the Pict ecosystem:

- [pict](https://github.com/stevenvelozo/pict) - UI framework (includes many built-in template expressions)
- [pict-provider](https://github.com/stevenvelozo/pict-provider) - Provider base class
- [pict-view](https://github.com/stevenvelozo/pict-view) - View base class
- [precedent](https://github.com/stevenvelozo/precedent) - Pattern trie engine used for template matching
- [fable](https://github.com/stevenvelozo/fable) - Application services framework

## Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run coverage
```

## License

MIT - See [LICENSE](LICENSE) for details.

## Author

Steven Velozo - [steven@velozo.com](mailto:steven@velozo.com)
