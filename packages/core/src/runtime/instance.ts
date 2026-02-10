/**
 * packages/core/src/runtime/instance.ts — Instance ID allocation.
 *
 * Why: Provides stable, monotonically increasing IDs for runtime instances.
 * These IDs persist across reconciliation for reused instances, enabling
 * state association and lifecycle tracking.
 *
 * @see docs/guide/runtime-and-layout.md
 */

/** Opaque numeric identifier for a runtime instance. */
export type InstanceId = number;

/** Factory interface for allocating new instance IDs. */
export type InstanceIdAllocator = Readonly<{
  allocate: () => InstanceId;
}>;

/**
 * Create an instance ID allocator starting at a given value.
 * Each call to allocate() returns the next sequential ID.
 */
export function createInstanceIdAllocator(startAt: InstanceId = 1): InstanceIdAllocator {
  if (!Number.isInteger(startAt) || startAt < 0) {
    throw new Error(
      `createInstanceIdAllocator: startAt must be an integer >= 0 (got ${String(startAt)})`,
    );
  }

  let next = startAt;

  return Object.freeze({
    allocate: () => {
      const id = next;
      next++;
      return id;
    },
  });
}
