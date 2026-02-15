# API Reference

## Class: PictTemplateExpression

Extends `fable-serviceproviderbase`. Base class for all Pict template expression handlers.

### Constructor

```javascript
new PictTemplateExpression(pFable, pOptions, pServiceHash)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pFable` | object | A Fable or Pict instance |
| `pOptions` | object | Provider configuration (optional) |
| `pServiceHash` | string | Service identifier |

On construction, sets `this.serviceType` to `'PictTemplate'` and creates a `this.pict` alias for the Fable instance.

---

## Properties

### pict

Reference to the Pict/Fable instance. Use this to access `parseTemplate()`, `parseTemplateByHash()`, `parseTemplateSetByHash()`, logging, and other framework services.

**Type:** `Pict`

### serviceType

Always `'PictTemplate'`. Used by the Fable service framework to group template expression handlers.

**Type:** `string`

---

## Methods

### render(pTemplateHash, pRecord, pContextArray, pScope, pState)

Synchronous template rendering. Override this method in subclasses to implement custom expression logic.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pTemplateHash` | string | The content between the start and end delimiters |
| `pRecord` | any | The data object for the current template render |
| `pContextArray` | Array | Additional context objects (access via `Context[n]`) |
| `pScope` | any | Sticky scope for carrying state across renders (optional) |
| `pState` | any | Catchall state object for framework plumbing (optional) |

**Returns:** `string` — The rendered output. The base class returns an empty string.

```javascript
render(pTemplateHash, pRecord, pContextArray, pScope, pState)
{
	let tmpValue = this.resolveStateFromAddress(pTemplateHash.trim(), pRecord, pContextArray, null, pScope, pState);
	return (tmpValue != null) ? String(tmpValue) : '';
}
```

---

### renderAsync(pTemplateHash, pRecord, fCallback, pContextArray, pScope, pState)

Asynchronous template rendering. Override this for handlers that need to perform I/O or other async operations. The default implementation wraps `render()` and calls back immediately.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pTemplateHash` | string | The content between the start and end delimiters |
| `pRecord` | any | The data object for the current template render |
| `fCallback` | function | Callback: `(error, renderedString)` |
| `pContextArray` | Array | Additional context objects |
| `pScope` | any | Sticky scope (optional) |
| `pState` | any | Catchall state (optional) |

**Returns:** `void`

```javascript
renderAsync(pTemplateHash, pRecord, fCallback, pContextArray, pScope, pState)
{
	// Fetch data, then callback
	fetchSomeData(pTemplateHash,
		(pError, pData) =>
		{
			if (pError) return fCallback(pError, '');
			return fCallback(null, JSON.stringify(pData));
		});
}
```

---

### addPattern(pMatchStart, pMatchEnd)

Register a delimiter pair with the MetaTemplate trie. Multiple patterns can be registered for the same handler — commonly used to provide both long and short forms.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMatchStart` | string | Opening delimiter (e.g. `'{~MyTag:'`) |
| `pMatchEnd` | string | Closing delimiter (e.g. `'~}'`) |

**Returns:** `void`

```javascript
constructor(pFable, pOptions, pServiceHash)
{
	super(pFable, pOptions, pServiceHash);

	// Long form and short form for the same handler
	this.addPattern('{~Uppercase:', '~}');
	this.addPattern('{~UC:', '~}');
}
```

---

### resolveStateFromAddress(pAddress, pRecord, pContextArray, pRootDataObject, pScope, pState)

Resolve a dot-notation address to a value. Delegates to `pict.resolveStateFromAddress()`. This is the primary mechanism for accessing data inside template handlers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `pAddress` | string | Dot-notation path (e.g. `'Record.User.Name'`) |
| `pRecord` | object | The current Record |
| `pContextArray` | Array | Context objects (optional) |
| `pRootDataObject` | object | Custom root object for resolution (optional) |
| `pScope` | any | Scope object (optional) |
| `pState` | any | State object (optional) |

**Returns:** `any` — The resolved value, or `undefined`.

#### Address Resolution Prefixes

| Prefix | Resolves From |
|--------|--------------|
| `Record.` | `pRecord` parameter |
| `AppData.` | `pict.AppData` |
| `Context[n].` | `pContextArray[n]` |
| `Scope.` | `pScope` parameter |
| `Pict.` | The Pict instance |
| *(none)* | Falls back to root data object |

---

## Static Properties

### template_hash

The default template hash for the base class is `'Default'`. Subclasses should export their own `template_hash` to identify themselves:

```javascript
module.exports = MyTemplate;
module.exports.template_hash = 'MyCustomTag';
```

This hash is used by `pict.addTemplate()` to register the handler as a Fable service.

---

## Registration

Register a template expression class with a Pict instance:

```javascript
pict.addTemplate(MyTemplateClass);
```

The class is instantiated as a `'PictTemplate'` service. Its constructor runs `addPattern()` to register delimiters with the MetaTemplate engine. After registration, any template string containing the registered delimiters will route through the handler.

---

## Rendering Pipeline

When `pict.parseTemplate(templateString, record)` is called:

1. **Scan** — MetaTemplate's trie parser scans the string for registered delimiter pairs
2. **Extract** — Content between a matched start/end pair becomes `pTemplateHash`
3. **Dispatch** — The registered handler's `render()` (or `renderAsync()`) is called
4. **Replace** — The handler's return value replaces the entire tag (delimiters included)
5. **Repeat** — Scanning continues for any remaining tags in the string

Nested templates work because handlers can call `pict.parseTemplateByHash()` or `pict.parseTemplateSetByHash()` inside their `render()` method, which triggers the same pipeline recursively.

---

## Comparison Operators

The `TemplateIf` family of expressions uses comparison operators in the format `left^OPERATOR^right`. These are evaluated by the `compareValues()` method in the TemplateIf base class:

| Operator | Description |
|----------|-------------|
| `==` | Loose equality |
| `===` | Strict equality |
| `!=` | Loose inequality |
| `!==` | Strict inequality |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |
| `TRUE` | Left value is strictly `true` |
| `FALSE` | Left value is strictly `false` |
| `LNGT` | Left value's `.length` is greater than right |
| `LNLT` | Left value's `.length` is less than right |

---

## Complete Expression Reference

### Data Access

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~Data:` | `{~D:` | `address` or `address:default` | Resolve address; return default if empty |
| `{~DataWithTemplateFallback:` | — | `address:TemplateHash` | Resolve address; render fallback template if empty |
| `{~DataWithAbsoluteFallback:` | — | `address:literal` | Resolve address; return literal string if empty |
| `{~DataValueByKey:` | — | `mapAddress:keyAddress` | Look up a value in a map by key |
| `{~DataJson:` | `{~DJ:` | `address` | JSON-stringify the resolved value |
| `{~DataEncodeJavascriptString:` | — | `address` | Escape value for JavaScript string context |

### Template Composition

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~Template:` | `{~T:` | `TemplateHash` or `TemplateHash:address` | Render named template, optionally with data |
| `{~TemplateSet:` | `{~TS:` | `TemplateHash:arrayAddress` | Render template once per array element |
| `{~TemplateValueSet:` | `{~TVS:` | `TemplateHash:arrayAddress` | Render template set, collect values |
| `{~TemplateSetWithPayload:` | — | `TemplateHash:arrayAddress:payloadAddress` | Template set with extra payload context |
| `{~TemplateFromAddress:` | — | `addressOfTemplateName:dataAddress` | Template name comes from data |
| `{~TemplateFromMap:` | — | `mapAddress:keyAddress:dataAddress` | Select template from a map by key |
| `{~TemplateSetFromMap:` | — | `mapAddress:keyAddress:arrayAddress` | Template set with map-based selection |
| `{~TemplateByReference:` | — | `referenceAddress` | Resolve template name from a reference |
| `{~TemplateByDataAddress:` | — | `addressOfTemplate` | Address points to a template string |
| `{~TemplateByTypes:` | — | `typeAddress:dataAddress` | Select template by type dispatch |

### Conditional Logic

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~TemplateIf:` | `{~TIf:` | `TemplateHash:dataAddress:left^OP^right` | Both sides resolved from data |
| `{~TemplateIfAbsolute:` | `{~TIfAbs:` | `TemplateHash:dataAddress:left^OP^literal` | Left resolved, right is a literal string |
| `{~NotEmpty:` | — | `address^fallback` | Return value if not empty, else fallback |

### Data Formatting

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~Join:` | `{~J:` | `separator^addr1^addr2^...` | Join values/arrays with separator |
| `{~JoinUnique:` | — | `separator^addr1^addr2^...` | Join unique values |
| `{~PluckJoinUnique:` | — | `separator^property^arrayAddress` | Pluck property from objects, join unique |
| `{~Dollars:` | — | `address` | Format as US currency |
| `{~Digits:` | — | `address` | Extract digits only |
| `{~DateOnlyFormat:` | — | `address` | Verbose date format |
| `{~DateOnlyYMD:` | — | `address` | YYYY-MM-DD |
| `{~DateTimeFormat:` | — | `address` | Verbose datetime format |
| `{~DateTimeYMD:` | — | `address` | YYYY-MM-DD HH:MM:SS |
| `{~PascalCaseIdentifier:` | — | `address` | Convert to PascalCase |
| `{~HtmlCommentStart:` | `{~HCS:` | `address` | Output `<!--` if value is truthy |
| `{~HtmlCommentEnd:` | `{~HCE:` | `address` | Output `-->` if value is truthy |

### Views and Entities

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~View:` | `{~V:` | `ViewHash` | Render a Pict view inline |
| `{~Entity:` | `{~E:` | `Entity^ID^TemplateHash` | Load and render an entity |

### Expression Solving

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~Solve:` | — | `expression` | Evaluate a math expression |
| `{~SolveByReference:` | `{~SBR:` | `equationAddr:dataAddr:manifestAddr` | Solve with referenced equation |

### Data Generation

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~RandomNumber:` | — | `min^max` | Random integer in range |
| `{~RandomNumberString:` | — | `min^max` | Random integer as string |

### Debugging

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~LogValue:` | `{~LV:` | `address` | Log resolved value (returns empty) |
| `{~LogStatement:` | — | `message` | Log a static message (returns empty) |
| `{~LogValueTree:` | — | `address` | Log object tree recursively |
| `{~DataValueTree:` | — | `address` | Return object tree as string |
| `{~Breakpoint:` | — | *(any)* | Trigger `debugger` breakpoint |

### Other

| Prefix | Short | Hash Format | Behavior |
|--------|-------|-------------|----------|
| `{~Self:` | — | *(any)* | Returns Pict instance name |
