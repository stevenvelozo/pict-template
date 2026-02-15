# Data Access & List Rendering

This guide walks through the template expressions you will use most often: reading data, rendering lists, and combining values with joins. Every example assumes a Pict instance with the default built-in templates.

---

## Data Access with `{~D:~}`

The `Data` expression resolves a dot-notation address against the current data context.

### Basic Value

```javascript
let result = pict.parseTemplate(
	'Hello, {~D:Record.Name~}!',
	{ Name: 'Alice' }
);
// => "Hello, Alice!"
```

`Record.` refers to the object passed as the second argument to `parseTemplate()`.

### Nested Properties

Dot notation traverses as deep as needed:

```javascript
let result = pict.parseTemplate(
	'{~D:Record.User.Address.City~}',
	{ User: { Address: { City: 'Portland' } } }
);
// => "Portland"
```

### Default Values

Add a colon after the address to provide a fallback when the value is empty, null, or undefined:

```javascript
let result = pict.parseTemplate(
	'Role: {~D:Record.Role:Guest~}',
	{ Name: 'Bob' }
);
// => "Role: Guest"
```

The fallback is a plain string — it is not resolved as an address. If you need a template-based fallback, use `{~DataWithTemplateFallback:~}` instead.

### AppData Access

Pict stores application-wide state on `pict.AppData`. Templates can read it directly:

```javascript
pict.AppData.Settings = { Theme: 'dark', Locale: 'en-US' };

let result = pict.parseTemplate('Theme: {~D:AppData.Settings.Theme~}', {});
// => "Theme: dark"
```

### Context Array

Pass extra data objects alongside the Record using the context array parameter:

```javascript
let result = pict.parseTemplate(
	'{~D:Record.Label~}: {~D:Context[0].Value~}',
	{ Label: 'Score' },
	null,
	[{ Value: 42 }]
);
// => "Score: 42"
```

Context objects are indexed by position: `Context[0]`, `Context[1]`, etc.

### Scope

The scope parameter carries state that persists across template renders:

```javascript
let tmpScope = { UserName: 'Charlie' };

let result = pict.parseTemplate(
	'Welcome back, {~D:Scope.UserName~}',
	{},
	null,
	null,
	tmpScope
);
// => "Welcome back, Charlie"
```

---

## JSON Output with `{~DJ:~}`

Use `DataJson` to serialize an object or value as a JSON string:

```javascript
let result = pict.parseTemplate(
	'<script>var cfg = {~DJ:Record.Config~};</script>',
	{ Config: { debug: true, version: 3 } }
);
// => '<script>var cfg = {"debug":true,"version":3};</script>'
```

This is useful for embedding data in HTML `<script>` blocks or data attributes.

---

## Named Templates with `{~T:~}`

The `Template` expression renders a named template registered on a Pict view. In a view's `Templates` array, each template gets a `Hash` — that hash is used here.

### View Configuration

```javascript
const _ViewConfiguration =
{
	ViewIdentifier: "UserProfile",
	Templates:
	[
		{
			Hash: "UserProfile-Card-Template",
			Template: /*html*/`
<div class="user-card">
	<h2>{~D:Record.DisplayName~}</h2>
	<p>{~D:Record.Email~}</p>
</div>`
		},
		{
			Hash: "UserProfile-Page-Template",
			Template: /*html*/`
<div class="profile-page">
	<h1>User Profile</h1>
	{~T:UserProfile-Card-Template:Record.User~}
</div>`
		}
	]
};
```

Here `{~T:UserProfile-Card-Template:Record.User~}` renders the `UserProfile-Card-Template` template, passing `Record.User` as the data object. Inside that inner template, `Record.DisplayName` refers to the `User` object's `DisplayName` property.

### Without a Data Address

If you omit the data address, the current Record is passed through:

```
{~T:UserProfile-Card-Template~}
```

---

## List Rendering with `{~TS:~}`

The `TemplateSet` expression iterates over an array, rendering a template once per element.

### Data

```javascript
pict.AppData.Inventory =
{
	Items:
	[
		{ Name: 'Widget', Price: 9.99 },
		{ Name: 'Gadget', Price: 24.50 },
		{ Name: 'Gizmo', Price: 14.75 }
	]
};
```

### Templates

```javascript
Templates:
[
	{
		Hash: "Inventory-Row-Template",
		Template: /*html*/`<tr><td>{~D:Record.Name~}</td><td>${~D:Record.Price~}</td></tr>`
	},
	{
		Hash: "Inventory-Table-Template",
		Template: /*html*/`
<table>
	<thead><tr><th>Item</th><th>Price</th></tr></thead>
	<tbody>
		{~TS:Inventory-Row-Template:AppData.Inventory.Items~}
	</tbody>
</table>`
	}
]
```

When `Inventory-Table-Template` renders, `{~TS:Inventory-Row-Template:AppData.Inventory.Items~}` loops over the three items. For each one, `Inventory-Row-Template` is rendered with that item as `Record`.

The resulting HTML contains three `<tr>` rows — one per item in the array.

### Nested Sets

Template sets can nest. If each item has a sub-array, use a second `{~TS:~}` inside the row template:

```javascript
Templates:
[
	{
		Hash: "Tag-Badge-Template",
		Template: /*html*/`<span class="badge">{~D:Record~}</span>`
	},
	{
		Hash: "Product-Row-Template",
		Template: /*html*/`
<div class="product">
	<h3>{~D:Record.Name~}</h3>
	<div class="tags">{~TS:Tag-Badge-Template:Record.Tags~}</div>
</div>`
	},
	{
		Hash: "Product-List-Template",
		Template: /*html*/`
<div class="product-list">
	{~TS:Product-Row-Template:AppData.Products~}
</div>`
	}
]
```

With data like:

```javascript
pict.AppData.Products =
[
	{ Name: 'Widget', Tags: ['new', 'sale'] },
	{ Name: 'Gadget', Tags: ['popular'] }
];
```

The outer set iterates products; the inner set iterates each product's tags.

---

## Joining Values with `{~J:~}`

The `Join` expression concatenates values from one or more addresses, separated by a string. The format is:

```
{~J:separator^address1^address2^...~}
```

The first segment (before the first `^`) is the separator. Everything after is a data address.

### Simple Join

```javascript
let result = pict.parseTemplate(
	'{~J:, ^Record.City^Record.State^Record.Country~}',
	{ City: 'Portland', State: 'OR', Country: 'US' }
);
// => "Portland, OR, US"
```

### Joining an Array

If an address resolves to an array, each element is added to the list:

```javascript
let result = pict.parseTemplate(
	'Tags: {~J: | ^Record.Tags~}',
	{ Tags: ['javascript', 'node', 'pict'] }
);
// => "Tags: javascript | node | pict"
```

### Multiple Addresses with Arrays

You can mix scalar values and arrays across multiple addresses:

```javascript
let result = pict.parseTemplate(
	'{~J:, ^Record.Primary^Record.Alternates~}',
	{ Primary: 'alice@example.com', Alternates: ['bob@example.com', 'carol@example.com'] }
);
// => "alice@example.com, bob@example.com, carol@example.com"
```

### Unique Join

Use `{~JoinUnique:~}` to deduplicate values before joining:

```javascript
let result = pict.parseTemplate(
	'{~JoinUnique:, ^Record.ListA^Record.ListB~}',
	{ ListA: ['red', 'blue'], ListB: ['blue', 'green'] }
);
// => "red, blue, green"
```

---

## Combining Patterns

These expressions compose naturally. A common pattern for a data-driven page:

```javascript
Templates:
[
	{
		Hash: "StatusBadge-Template",
		Template: /*html*/`<span class="status-{~D:Record.Status~}">{~D:Record.Status~}</span>`
	},
	{
		Hash: "OrderRow-Template",
		Template: /*html*/`
<tr>
	<td>{~D:Record.OrderId~}</td>
	<td>{~D:Record.Customer~}</td>
	<td>{~Dollars:Record.Total~}</td>
	<td>{~DateOnlyYMD:Record.CreatedAt~}</td>
	<td>{~T:StatusBadge-Template~}</td>
</tr>`
	},
	{
		Hash: "OrderTable-Template",
		Template: /*html*/`
<h2>Orders ({~D:AppData.Dashboard.OrderCount:0~})</h2>
<table>
	<thead>
		<tr><th>ID</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr>
	</thead>
	<tbody>
		{~TS:OrderRow-Template:AppData.Dashboard.Orders~}
	</tbody>
</table>`
	}
]
```

This renders a complete orders table:
- `{~TS:~}` iterates the orders array
- Each row uses `{~D:~}` for simple fields
- `{~Dollars:~}` and `{~DateOnlyYMD:~}` format the total and date
- `{~T:~}` composes the status badge as a nested template
- The heading uses `{~D:~}` with a default of `0` for the count
