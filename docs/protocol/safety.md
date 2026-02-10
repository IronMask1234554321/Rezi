# Safety rules

Rezi treats all binary buffers as untrusted.

Key rules:

- validate sizes and alignment before reading
- never allocate based on untrusted sizes without caps
- never throw from parsers; return structured errors

See:

- [Event batches (ZREV)](zrev.md)
- [Drawlists (ZRDL)](zrdl.md)
