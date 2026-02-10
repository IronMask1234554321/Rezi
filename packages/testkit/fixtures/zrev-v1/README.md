# ZREV v1 Fixtures

All fixtures are ZREV v1 event batches as specified by:
- [Protocol overview](../../../../docs/protocol/index.md)
- [ZREV event batches](../../../../docs/protocol/zrev.md)

Paths are relative to `packages/testkit/fixtures/`.

## Valid

Each valid fixture parses with:
- `ok === true`
- `value.flags === 0`
- exactly one decoded event in `value.events`

### `zrev-v1/valid/key.bin`

Expected event:
```ts
{ kind: "key", timeMs: 1000, key: 23, mods: 3, action: "down" }
```

### `zrev-v1/valid/text.bin`

Expected event:
```ts
{ kind: "text", timeMs: 2000, codepoint: 0x41 }
```

### `zrev-v1/valid/paste.bin`

Expected event:
```ts
{ kind: "paste", timeMs: 3000, bytes: Uint8Array.of(0x68,0x65,0x6c,0x6c,0x6f) } // "hello"
```

### `zrev-v1/valid/mouse.bin`

Expected event:
```ts
{ kind: "mouse", timeMs: 4000, x: 10, y: 5, mouseKind: 1, mods: 0, buttons: 1, wheelX: 0, wheelY: -1 }
```

### `zrev-v1/valid/resize.bin`

Expected event:
```ts
{ kind: "resize", timeMs: 5000, cols: 80, rows: 24 }
```

### `zrev-v1/valid/tick.bin`

Expected event:
```ts
{ kind: "tick", timeMs: 6000, dtMs: 16 }
```

### `zrev-v1/valid/user.bin`

Expected event:
```ts
{ kind: "user", timeMs: 7000, tag: 42, payload: Uint8Array.of(1,2,3) }
```

## Invalid

Each invalid fixture parses with `ok === false` and the exact `error.code` and `error.offset` below.

### `zrev-v1/invalid/truncated_header.bin`

- `error.code === "ZR_TRUNCATED"`
- `error.offset === 0`

### `zrev-v1/invalid/truncated_record_header.bin`

- `error.code === "ZR_TRUNCATED"`
- `error.offset === 24`

### `zrev-v1/invalid/truncated_payload.bin`

- `error.code === "ZR_INVALID_RECORD"`
- `error.offset === 24`

### `zrev-v1/invalid/total_size_mismatch.bin`

- `error.code === "ZR_SIZE_MISMATCH"`
- `error.offset === 24`

### `zrev-v1/invalid/misaligned_record_size.bin`

- `error.code === "ZR_MISALIGNED"`
- `error.offset === 24`

### `zrev-v1/invalid/bad_magic.bin`

- `error.code === "ZR_BAD_MAGIC"`
- `error.offset === 0`

### `zrev-v1/invalid/bad_version.bin`

- `error.code === "ZR_UNSUPPORTED_VERSION"`
- `error.offset === 4`
