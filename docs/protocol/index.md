# Protocol

Rezi’s engine boundary is binary:

- **ZRDL**: drawlist bytes written by core, consumed by the engine
- **ZREV**: event batch bytes produced by the engine, parsed by core

These formats are:

- little-endian
- 4-byte aligned
- versioned
- validated strictly

Start with:

- [Event batches (ZREV)](zrev.md)
- [Drawlists (ZRDL)](zrdl.md)
- [ABI pins](abi.md)
