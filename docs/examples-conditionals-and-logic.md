# Conditionals & Logic

Pict templates support conditional rendering through the `TemplateIf` family of expressions. These let you show or hide blocks of content based on data comparisons, and they can be combined with template composition for complex UI logic.

---

## TemplateIf — `{~TIf:~}`

Conditionally render a named template when a comparison evaluates to true. **Both sides** of the comparison are resolved as data addresses.

### Format

```
{~TIf:TemplateHash:DataAddress:LeftAddress^OPERATOR^RightAddress~}
```

| Segment | Purpose |
|---------|---------|
| `TemplateHash` | The named template to render if the condition is true |
| `DataAddress` | Data to pass into the rendered template |
| `LeftAddress` | Data address for the left side of the comparison |
| `OPERATOR` | Comparison operator (`==`, `===`, `!=`, `<`, `>`, etc.) |
| `RightAddress` | Data address for the right side of the comparison |

Segments are separated by colons (`:`). The comparison itself uses carets (`^`) as sub-separators.

### Example: Show Admin Controls

```javascript
Templates:
[
	{
		Hash: "AdminControls-Template",
		Template: /*html*/`
<div class="admin-controls">
	<button onclick="{~P~}.PictApplication.deleteItem('{~D:Record.Id~}')">Delete</button>
	<button onclick="{~P~}.PictApplication.editItem('{~D:Record.Id~}')">Edit</button>
</div>`
	},
	{
		Hash: "ItemCard-Template",
		Template: /*html*/`
<div class="item-card">
	<h3>{~D:Record.Name~}</h3>
	<p>{~D:Record.Description~}</p>
	{~TIf:AdminControls-Template:Record:AppData.User.Role^==^AppData.User.AdminRole~}
</div>`
	}
]
```

With data:

```javascript
pict.AppData.User = { Role: 'admin', AdminRole: 'admin' };
```

The `AdminControls-Template` renders because `AppData.User.Role` (`'admin'`) equals `AppData.User.AdminRole` (`'admin'`). If the user's role changes, the controls disappear — both sides are resolved dynamically.

---

## TemplateIfAbsolute — `{~TIfAbs:~}`

Works like `TemplateIf`, except the **right side is a literal string** — it is not resolved as a data address.

### Format

```
{~TIfAbs:TemplateHash:DataAddress:LeftAddress^OPERATOR^LiteralValue~}
```

The `LiteralValue` is compared directly as a string. This is the more commonly used form when you are comparing against known constants.

### Example: Status-Based Badge

```javascript
Templates:
[
	{
		Hash: "Badge-Active-Template",
		Template: /*html*/`<span class="badge badge-green">Active</span>`
	},
	{
		Hash: "Badge-Inactive-Template",
		Template: /*html*/`<span class="badge badge-gray">Inactive</span>`
	},
	{
		Hash: "UserRow-Template",
		Template: /*html*/`
<tr>
	<td>{~D:Record.Name~}</td>
	<td>{~D:Record.Email~}</td>
	<td>
		{~TIfAbs:Badge-Active-Template:Record:Record.Status^==^active~}
		{~TIfAbs:Badge-Inactive-Template:Record:Record.Status^==^inactive~}
	</td>
</tr>`
	}
]
```

When `Record.Status` is `'active'`, the green badge renders and the gray one returns an empty string. When `Record.Status` is `'inactive'`, the opposite happens.

### Example: Show Warning When Stock Is Low

```javascript
Templates:
[
	{
		Hash: "LowStock-Warning-Template",
		Template: /*html*/`<span class="warning">Low stock: only {~D:Record.Quantity~} left!</span>`
	},
	{
		Hash: "Product-Template",
		Template: /*html*/`
<div class="product">
	<h3>{~D:Record.Name~}</h3>
	<p>Price: {~Dollars:Record.Price~}</p>
	{~TIfAbs:LowStock-Warning-Template:Record:Record.Quantity^<^10~}
</div>`
	}
]
```

The warning appears only when `Quantity` is less than `10`. Note that the `<` operator performs a less-than comparison.

---

## Available Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Loose equality | `Record.Status^==^active` |
| `===` | Strict equality | `Record.Type^===^number` |
| `!=` | Loose inequality | `Record.Role^!=^guest` |
| `!==` | Strict inequality | `Record.Id^!==^0` |
| `<` | Less than | `Record.Count^<^5` |
| `>` | Greater than | `Record.Score^>^100` |
| `<=` | Less than or equal | `Record.Age^<=^18` |
| `>=` | Greater than or equal | `Record.Balance^>=^0` |
| `TRUE` | Left is strictly `true` | `Record.IsAdmin^TRUE^_` |
| `FALSE` | Left is strictly `false` | `Record.Disabled^FALSE^_` |
| `LNGT` | Length greater than | `Record.Items^LNGT^0` |
| `LNLT` | Length less than | `Record.Tags^LNLT^5` |

For `TRUE` and `FALSE`, the right side value is ignored (use `_` or any placeholder). For `LNGT` and `LNLT`, the right side is the length threshold.

---

## NotEmpty — `{~NotEmpty:~}`

A simpler conditional that returns a value if it is not empty, or a fallback otherwise.

### Format

```
{~NotEmpty:address^fallback~}
```

### Example: Display Name with Fallback

```javascript
let result = pict.parseTemplate(
	'Author: {~NotEmpty:Record.Author^Anonymous~}',
	{ Author: '' }
);
// => "Author: Anonymous"
```

```javascript
let result = pict.parseTemplate(
	'Author: {~NotEmpty:Record.Author^Anonymous~}',
	{ Author: 'Jane Doe' }
);
// => "Author: Jane Doe"
```

---

## HTML Comment Toggling — `{~HCS:~}` / `{~HCE:~}`

Conditionally wrap content in an HTML comment to hide it from rendering:

```
{~HCS:Record.HideSection~}
<div class="optional-section">
	<p>This content is hidden when Record.HideSection is truthy.</p>
</div>
{~HCE:Record.HideSection~}
```

When `Record.HideSection` is truthy, `{~HCS:~}` outputs `<!--` and `{~HCE:~}` outputs `-->`, wrapping the content in a comment. When falsy, both output empty strings and the content renders normally.

---

## Composing Conditionals

Real applications combine these patterns. Here is a user profile card that adapts to different states:

### Templates

```javascript
Templates:
[
	{
		Hash: "Profile-EditButton-Template",
		Template: /*html*/`
<button class="btn-edit" onclick="{~P~}.PictApplication.editProfile()">
	Edit Profile
</button>`
	},
	{
		Hash: "Profile-VerifiedBadge-Template",
		Template: /*html*/`<span class="verified-badge" title="Verified account">&#10003;</span>`
	},
	{
		Hash: "Profile-Avatar-Template",
		Template: /*html*/`<img src="{~D:Record.AvatarUrl~}" alt="{~D:Record.Name~}" class="avatar" />`
	},
	{
		Hash: "Profile-DefaultAvatar-Template",
		Template: /*html*/`<div class="avatar avatar-placeholder">{~D:Record.Initials~}</div>`
	},
	{
		Hash: "Profile-Card-Template",
		Template: /*html*/`
<div class="profile-card">
	{~TIfAbs:Profile-Avatar-Template:Record:Record.AvatarUrl^LNGT^0~}
	{~TIfAbs:Profile-DefaultAvatar-Template:Record:Record.AvatarUrl^LNLT^1~}
	<div class="profile-info">
		<h2>
			{~D:Record.Name~}
			{~TIfAbs:Profile-VerifiedBadge-Template:Record:Record.IsVerified^==^true~}
		</h2>
		<p>{~NotEmpty:Record.Bio^No bio provided.~}</p>
		<p class="member-since">Member since {~DateOnlyYMD:Record.JoinDate~}</p>
	</div>
	{~TIf:Profile-EditButton-Template:Record:AppData.Session.UserId^==^Record.UserId~}
</div>`
	}
]
```

This single card template handles four conditional behaviors:

1. **Avatar** — Uses `LNGT` (length greater than) to check if `AvatarUrl` has content; shows a placeholder with initials if not
2. **Verified badge** — Appears only when `IsVerified` equals the literal `'true'`
3. **Bio fallback** — `NotEmpty` shows the bio or a default message
4. **Edit button** — Uses `TIf` (both sides resolved) to compare the session user ID against the profile's user ID, showing the button only on the user's own profile

### Data

```javascript
pict.AppData.Session = { UserId: '42' };

// Rendering someone else's profile — no edit button
let otherUser =
{
	UserId: '99',
	Name: 'Alice',
	AvatarUrl: 'https://example.com/alice.jpg',
	IsVerified: 'true',
	Bio: 'Building things with Pict.',
	JoinDate: '2024-03-15',
	Initials: 'A'
};

// Rendering your own profile — edit button appears
let currentUser =
{
	UserId: '42',
	Name: 'Bob',
	AvatarUrl: '',
	IsVerified: 'false',
	Bio: '',
	JoinDate: '2023-11-01',
	Initials: 'B'
};
```

For `otherUser`: avatar image renders, verified badge shows, bio text shows, no edit button.
For `currentUser`: placeholder avatar with "B", no verified badge, "No bio provided." fallback, edit button visible.

---

## Tips

- **`TIf` vs `TIfAbs`** — Use `TIf` when both sides come from data (comparing two fields). Use `TIfAbs` when comparing a field against a known constant string.
- **Empty string as false** — When a `TIfAbs` comparison fails, the expression returns an empty string. Multiple conditionals can sit side-by-side — only the matching one produces output.
- **Composing with `TS`** — `TIf` and `TIfAbs` work inside `TemplateSet` rows. Each iteration evaluates the condition against that row's data.
- **No else** — There is no built-in else clause. Use two complementary conditions (e.g. `==` and `!=`) for if/else behavior.
