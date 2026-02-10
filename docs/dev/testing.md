# Testing

Run the full test suite:

```bash
npm test
```

The repo uses:

- unit tests for pure modules
- golden tests for drawlists/layout/routing where byte-level stability matters
- fuzz-lite tests for binary parsers (bounded, never-throw)

