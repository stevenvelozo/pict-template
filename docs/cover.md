# Pict Template

> Extensible template expression base class for the Pict framework

Define custom template expressions with pluggable delimiters, synchronous and asynchronous rendering, and dot-notation data resolution. Every built-in Pict expression — from `{~D:~}` to `{~TS:~}` to `{~TIf:~}` — extends this base class.

- **Base Class** -- Extend `PictTemplateExpression` and override `render()` to create any expression type
- **Custom Delimiters** -- Register arbitrary start/stop patterns like `{~MyTag:` and `~}` via `addPattern()`
- **Data Resolution** -- Traverse nested objects with `resolveStateFromAddress()` using dot-notation addresses
- **Sync & Async** -- Implement `render()` for synchronous output or `renderAsync()` for callback-based workflows
- **Service Integration** -- Plugs into the Fable service provider framework with automatic registration

[Quick Start](README.md)
[API Reference](api.md)
[GitHub](https://github.com/stevenvelozo/pict-view)
