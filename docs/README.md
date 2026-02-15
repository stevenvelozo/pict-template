# Pict Template

A base class for building template expression handlers in the Pict framework. Every built-in Pict template expression — data access, iteration, conditionals, formatting, debugging — extends this class and registers one or more delimiter patterns with the template engine.

## Install

```bash
npm install pict-template
```

## How Template Expressions Work

Pict templates are strings containing expression tags. Each tag has a **start delimiter** and an **end delimiter** with content between them:

```
{~D:Record.Name~}
 ↑              ↑
 start          end
 delimiter      delimiter
```

When `pict.parseTemplate()` encounters a delimiter pair, it routes the content between them to the registered handler's `render()` method. The handler resolves data, formats output, or delegates to other templates, then returns a string that replaces the tag in place.

## Quick Start

### 1. Create an Expression Class

Extend `PictTemplateExpression`, register a delimiter pair, and override `render()`:

```javascript
const libPictTemplate = require('pict-template');

class UpperCaseTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~Upper:', '~}');
		this.addPattern('{~UC:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash.trim(), pRecord, pContextArray, null, pScope, pState);
		return (typeof tmpValue === 'string') ? tmpValue.toUpperCase() : '';
	}
}

module.exports = UpperCaseTemplate;
module.exports.template_hash = 'UpperCase';
```

### 2. Register with Pict

```javascript
const libPict = require('pict');
const libUpperCase = require('./UpperCase-Template.js');

let pict = new libPict();
pict.addTemplate(libUpperCase);
```

### 3. Use in Templates

```javascript
let result = pict.parseTemplate(
	'Hello, {~UC:Record.Name~}!',
	{ Name: 'world' }
);
// => "Hello, WORLD!"
```

## Built-in Expression Types

Pict ships with 40+ built-in expression handlers. Here are the most commonly used, grouped by category:

### Data Access

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~Data:address~}` | `{~D:~}` | Resolve a value by dot-notation address |
| `{~Data:address:fallback~}` | `{~D:~}` | Resolve with a default if the value is empty |
| `{~DataJson:address~}` | `{~DJ:~}` | JSON-stringify a value |

### Template Composition

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~Template:Hash:address~}` | `{~T:~}` | Render a named template with data |
| `{~TemplateSet:Hash:address~}` | `{~TS:~}` | Render a template for each item in an array |
| `{~TemplateValueSet:Hash:address~}` | `{~TVS:~}` | Render a template, collecting output values |

### Conditional Logic

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~TemplateIf:Hash:data:left^OP^right~}` | `{~TIf:~}` | Render a template if a comparison is true (both sides resolved) |
| `{~TemplateIfAbsolute:Hash:data:left^OP^literal~}` | `{~TIfAbs:~}` | Render a template if a comparison is true (right side is a literal) |
| `{~NotEmpty:address^fallback~}` | — | Return the value if not empty, otherwise the fallback |

### Data Formatting

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~Join:sep^addr1^addr2~}` | `{~J:~}` | Join values or arrays with a separator |
| `{~JoinUnique:sep^addr1^addr2~}` | — | Join unique values with a separator |
| `{~Dollars:address~}` | — | Format a number as US currency |
| `{~Digits:address~}` | — | Extract only digit characters |
| `{~DateOnlyYMD:address~}` | — | Format as YYYY-MM-DD |
| `{~DateTimeYMD:address~}` | — | Format as YYYY-MM-DD HH:MM:SS |
| `{~PascalCaseIdentifier:address~}` | — | Convert to PascalCase |

### Debugging

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~LogValue:address~}` | `{~LV:~}` | Log a value to the console (returns empty string) |
| `{~LogStatement:message~}` | — | Log a static message |
| `{~LogValueTree:address~}` | — | Log an object tree recursively |
| `{~Breakpoint:~}` | — | Trigger a debugger breakpoint |

### Other

| Expression | Short Form | Description |
|-----------|-----------|-------------|
| `{~Self:~}` | — | Reference to the Pict instance (browser: `window._Pict`) |
| `{~RandomNumber:min^max~}` | — | Generate a random integer in a range |
| `{~View:Hash~}` | `{~V:~}` | Render a Pict view inline |

## Data Resolution

All template expressions can access data through five resolution paths:

| Prefix | Source | Example |
|--------|--------|---------|
| `Record.` | The data object passed to `parseTemplate()` | `Record.User.Name` |
| `AppData.` | The Pict application data store | `AppData.Settings.Theme` |
| `Context[n].` | Items in the context array | `Context[0].Label` |
| `Scope.` | The sticky scope object | `Scope.Counter` |
| `Pict.` | The Pict instance itself | `Pict.PictApplication.navigateTo(...)` |

Addresses use dot notation to traverse nested objects. If an address does not match any of these prefixes, the engine looks it up on the root data object passed to the template.

## Architecture

```
pict.parseTemplate(string, record)
        │
        ▼
  MetaTemplate.parseString()
        │
        ├── scans for registered delimiters
        ├── extracts content between delimiters
        │
        ▼
  handler.render(content, record, contextArray, scope, state)
        │
        ├── resolveStateFromAddress() for data lookup
        ├── parseTemplateByHash() for nested templates
        │
        ▼
  returned string replaces the tag in-place
```

Each handler is a Fable service registered with `pict.addTemplate()`. The MetaTemplate trie matches delimiter pairs, and dispatches to the handler's `render()` or `renderAsync()` method.
