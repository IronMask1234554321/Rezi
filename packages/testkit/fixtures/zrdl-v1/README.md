# ZRDL v1 Golden Fixtures

These fixtures are **byte-for-byte** golden buffers for the ZRDL v1 drawlist format.

Reference: [ZRDL drawlists](../../../../docs/protocol/zrdl.md)

They are generated deterministically by `@rezi-ui/core`’s ZRDL v1 builder and are
checked by unit tests (no auto-update behavior).

All integers are little-endian and all sections are 4-byte aligned. Any padding bytes
are `0x00`.

## Files

### `golden/clear_only.bin`

Command sequence:
1. `clear()`

Header expectations:
- `cmd_count = 1`
- `cmd_bytes = 8`
- `strings_count = 0`, `strings_bytes_len = 0`
- `blobs_count = 0`, `blobs_bytes_len = 0`
- `total_size = 72`

---

### `golden/fill_rect.bin`

Command sequence:
1. `fillRect(1, 2, 3, 4, { fg: { r: 0, g: 255, b: 0 }, bold: true, underline: true })`

Header expectations:
- `cmd_count = 1`
- `cmd_bytes = 40`
- `strings_count = 0`, `strings_bytes_len = 0`
- `blobs_count = 0`, `blobs_bytes_len = 0`
- `total_size = 104`

---

### `golden/draw_text_interned.bin`

Command sequence (tests deterministic string interning by first use):
1. `drawText(0, 0, "hello", { fg: { r: 255, g: 255, b: 255 } })`
2. `drawText(0, 1, "hello")` (same string; reuses `string_index=0`)
3. `drawText(0, 2, "world", { bg: { r: 0, g: 0, b: 255 }, inverse: true })`

String table expectations:
- intern order: `"hello"` (index 0), then `"world"` (index 1)
- string spans: `[off=0,len=5]`, `[off=5,len=5]`
- `strings_bytes_len = 10` (`"helloworld"` in UTF-8)

Header expectations:
- `cmd_count = 3`
- `cmd_bytes = 144`
- `strings_count = 2`
- `blobs_count = 0`, `blobs_bytes_len = 0`
- `total_size = 236` (string bytes padded to 4-byte alignment)

---

### `golden/clip_nested.bin`

Command sequence:
1. `pushClip(0, 0, 10, 10)`
2. `pushClip(1, 1, 8, 8)`
3. `fillRect(2, 2, 3, 4, { bg: { r: 255, g: 0, b: 0 }, inverse: true })`
4. `popClip()`
5. `popClip()`

Header expectations:
- `cmd_count = 5`
- `cmd_bytes = 104`
- `strings_count = 0`, `strings_bytes_len = 0`
- `blobs_count = 0`, `blobs_bytes_len = 0`
- `total_size = 168`
