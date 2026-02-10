# Event batches (ZREV)

The engine emits input as a ZREV event batch.

Rezi parses ZREV deterministically:

- no reads past buffer end
- no unbounded allocations from untrusted sizes
- explicit, structured errors (no exceptions)

See:

- [Safety rules](safety.md)
- [Versioning](versioning.md)
