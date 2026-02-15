# Custom Template Expressions

The built-in expressions cover common needs, but pict-template's real power is extensibility. You can create any template expression by extending the base class and registering it with Pict. This guide walks through progressively complex examples.

---

## Anatomy of a Custom Expression

Every custom expression follows the same pattern:

1. **Extend** `pict-template`
2. **Register** delimiter patterns in the constructor with `addPattern()`
3. **Override** `render()` to return a string
4. **Export** a `template_hash` for service registration

```javascript
const libPictTemplate = require('pict-template');

class MyExpression extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~MyTag:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		// pTemplateHash is the content between the delimiters
		return 'result string';
	}
}

module.exports = MyExpression;
module.exports.template_hash = 'MyTag';
```

Register it:

```javascript
pict.addTemplate(MyExpression);
```

Now `{~MyTag:anything here~}` routes through your handler.

---

## Example 1: Pluralize

A simple expression that outputs "item" or "items" based on a count.

```javascript
const libPictTemplate = require('pict-template');

class PluralizeTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~Pluralize:', '~}');
		this.addPattern('{~PL:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		// Format: countAddress^singular^plural
		let tmpParts = pTemplateHash.trim().split('^');

		if (tmpParts.length < 3)
		{
			return '';
		}

		let tmpCount = this.resolveStateFromAddress(tmpParts[0], pRecord, pContextArray, null, pScope, pState);
		let tmpSingular = tmpParts[1];
		let tmpPlural = tmpParts[2];

		let tmpNumeric = Number.parseFloat(tmpCount);
		if (isNaN(tmpNumeric))
		{
			return tmpPlural;
		}

		return (tmpNumeric === 1) ? tmpSingular : tmpPlural;
	}
}

module.exports = PluralizeTemplate;
module.exports.template_hash = 'Pluralize';
```

### Usage

```
{~D:Record.Count~} {~PL:Record.Count^item^items~} in your cart
```

With `{ Count: 1 }` → `1 item in your cart`
With `{ Count: 5 }` → `5 items in your cart`

---

## Example 2: Gravatar URL

Build a Gravatar image URL from an email address. This shows how to use external logic (hashing) inside a template expression.

```javascript
const libPictTemplate = require('pict-template');
const libCrypto = require('crypto');

class GravatarTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~Gravatar:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		// Format: emailAddress^size
		let tmpParts = pTemplateHash.trim().split('^');

		let tmpEmail = this.resolveStateFromAddress(tmpParts[0], pRecord, pContextArray, null, pScope, pState);
		let tmpSize = (tmpParts.length > 1) ? tmpParts[1] : '80';

		if (!tmpEmail || typeof tmpEmail !== 'string')
		{
			return '';
		}

		let tmpHash = libCrypto.createHash('md5').update(tmpEmail.trim().toLowerCase()).digest('hex');
		return `https://www.gravatar.com/avatar/${tmpHash}?s=${tmpSize}&d=identicon`;
	}
}

module.exports = GravatarTemplate;
module.exports.template_hash = 'Gravatar';
```

### Usage

```html
<img src="{~Gravatar:Record.Email^120~}" alt="avatar" />
```

With `{ Email: 'alice@example.com' }` → renders a 120px Gravatar URL.

---

## Example 3: Time Ago (Relative Dates)

A more complex expression that converts a timestamp to a human-readable relative time string.

```javascript
const libPictTemplate = require('pict-template');

class TimeAgoTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~TimeAgo:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash.trim(), pRecord, pContextArray, null, pScope, pState);

		if (!tmpValue)
		{
			return '';
		}

		let tmpDate = new Date(tmpValue);
		if (isNaN(tmpDate.getTime()))
		{
			return String(tmpValue);
		}

		let tmpSeconds = Math.floor((Date.now() - tmpDate.getTime()) / 1000);

		if (tmpSeconds < 60) return 'just now';
		if (tmpSeconds < 3600) return `${Math.floor(tmpSeconds / 60)}m ago`;
		if (tmpSeconds < 86400) return `${Math.floor(tmpSeconds / 3600)}h ago`;
		if (tmpSeconds < 2592000) return `${Math.floor(tmpSeconds / 86400)}d ago`;

		return tmpDate.toLocaleDateString();
	}
}

module.exports = TimeAgoTemplate;
module.exports.template_hash = 'TimeAgo';
```

### Usage

```html
<span class="timestamp">{~TimeAgo:Record.CreatedAt~}</span>
```

Outputs relative strings like "just now", "5m ago", "3h ago", "14d ago", or falls back to a locale date string for older dates.

---

## Example 4: Async Data Fetch

Override `renderAsync()` for expressions that need I/O. This example fetches a label from a lookup service.

```javascript
const libPictTemplate = require('pict-template');

class LookupLabelTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{~LookupLabel:', '~}');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		// Synchronous fallback — return the raw code
		let tmpCode = this.resolveStateFromAddress(pTemplateHash.trim(), pRecord, pContextArray, null, pScope, pState);
		return tmpCode || '';
	}

	renderAsync(pTemplateHash, pRecord, fCallback, pContextArray, pScope, pState)
	{
		let tmpParts = pTemplateHash.trim().split('^');
		let tmpEntity = tmpParts[0];
		let tmpCodeAddress = tmpParts[1];
		let tmpCode = this.resolveStateFromAddress(tmpCodeAddress, pRecord, pContextArray, null, pScope, pState);

		if (!tmpCode)
		{
			return fCallback(null, '');
		}

		// Check a cache first
		let tmpCacheKey = `${tmpEntity}_${tmpCode}`;
		if (this.pict.AppData.LabelCache && this.pict.AppData.LabelCache[tmpCacheKey])
		{
			return fCallback(null, this.pict.AppData.LabelCache[tmpCacheKey]);
		}

		// Simulate an async lookup (replace with real API call)
		setTimeout(
			() =>
			{
				let tmpLabel = `${tmpEntity} #${tmpCode}`;

				// Cache the result
				if (!this.pict.AppData.LabelCache)
				{
					this.pict.AppData.LabelCache = {};
				}
				this.pict.AppData.LabelCache[tmpCacheKey] = tmpLabel;

				return fCallback(null, tmpLabel);
			}, 50);
	}
}

module.exports = LookupLabelTemplate;
module.exports.template_hash = 'LookupLabel';
```

### Usage

```
Assigned to: {~LookupLabel:User^Record.AssigneeId~}
```

The async path is used during `pict.parseTemplate()` with a callback. The sync path provides a fallback when called synchronously.

---

## Example 5: Markdown Bold/Italic Shorthand

Custom delimiters do not have to look like `{~...~}`. You can register any pair of strings:

```javascript
const libPictTemplate = require('pict-template');

class MarkdownBoldTemplate extends libPictTemplate
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('**{', '}**');
	}

	render(pTemplateHash, pRecord, pContextArray, pScope, pState)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash.trim(), pRecord, pContextArray, null, pScope, pState);
		return `<strong>${tmpValue || ''}</strong>`;
	}
}

module.exports = MarkdownBoldTemplate;
module.exports.template_hash = 'MarkdownBold';
```

### Usage

```
Welcome, **{Record.Name}**!
```

Renders as:

```html
Welcome, <strong>Alice</strong>!
```

This shows that delimiter patterns are completely arbitrary — you can design whatever syntax feels natural for your application.

---

## Registering Multiple Expressions

Register all your custom expressions at application startup:

```javascript
const libPict = require('pict');
const libPictApplication = require('pict-application');

const libPluralizeTemplate = require('./templates/Pluralize-Template.js');
const libGravatarTemplate = require('./templates/Gravatar-Template.js');
const libTimeAgoTemplate = require('./templates/TimeAgo-Template.js');

class MyApp extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Register custom template expressions
		this.pict.addTemplate(libPluralizeTemplate);
		this.pict.addTemplate(libGravatarTemplate);
		this.pict.addTemplate(libTimeAgoTemplate);

		// Now all views can use {~PL:~}, {~Gravatar:~}, {~TimeAgo:~}
	}
}
```

Once registered, the expressions are available in every template across the entire application — in view templates, inline `parseTemplate()` calls, and anywhere the Pict template engine runs.

---

## Tips

- **Keep `render()` pure** — Avoid side effects. If you need side effects (logging, state mutation), use a dedicated expression type like the built-in `{~LV:~}`.
- **Use `resolveStateFromAddress()`** — This gives you the full resolution chain (Record, AppData, Context, Scope). Avoid parsing addresses manually.
- **Export `template_hash`** — This string identifies your handler in the Fable service registry. It should be unique across your application.
- **Provide both forms** — Register a long form (`{~Pluralize:`) and a short form (`{~PL:`) so templates stay readable when frequently used.
- **Return empty string on errors** — Template expressions should fail gracefully. Return `''` rather than throwing exceptions.
- **Use `^` for sub-parameters** — The convention across built-in expressions is to use `^` to separate parameters within the hash content. Follow this for consistency.
