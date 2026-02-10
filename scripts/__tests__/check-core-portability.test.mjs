/**
 * Tests for check-core-portability.mjs
 */

import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { checkCorePortability } from "../check-core-portability.mjs";

describe("check-core-portability", () => {
  test("passes for files with no forbidden patterns", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(
        join(tempDir, "good.ts"),
        `
export type Rgb = { r: number; g: number; b: number };
const arr = new Uint8Array([1, 2, 3]);
`.trim(),
      );

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, true);
      assert.equal(result.violations.length, 0);
      assert.ok(result.output.includes("OK"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("fails for node: imports", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "bad.ts"), 'import { readFileSync } from "node:fs";');

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.length > 0);
      assert.ok(result.output.includes("FAIL"));
      assert.ok(result.output.includes("node:* import"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("fails for Buffer usage", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "bad.ts"), 'const buf = Buffer.from("test");');

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.some((v) => v.pattern === "Buffer"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("fails for worker_threads import", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "bad.ts"), 'import { Worker } from "worker_threads";');

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.some((v) => v.pattern === "worker_threads import"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("fails for MessagePort", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "bad.ts"), "const port: MessagePort = null as any;");

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.some((v) => v.pattern === "MessagePort"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("fails for Worker identifier", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "bad.ts"), 'const w = new Worker("./foo.js");');

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.some((v) => v.pattern === "Worker"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("reports deterministic output with file:line:col", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(
        join(tempDir, "test.ts"),
        `const buf = Buffer.from("x");
const x = Buffer.alloc(1);`,
      );

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      // Should have exactly 2 Buffer violations
      assert.equal(result.violations.length, 2);
      // First should be line 1
      assert.equal(result.violations[0].line, 1);
      // Second should be line 2
      assert.equal(result.violations[1].line, 2);
      // Output should contain file:line:col format
      assert.ok(result.output.includes("test.ts:1:"));
      assert.ok(result.output.includes("test.ts:2:"));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("handles nested directories", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      const subDir = join(tempDir, "subdir");
      mkdirSync(subDir);
      writeFileSync(join(subDir, "nested.ts"), 'import {} from "node:path";');

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, false);
      assert.ok(result.violations.some((v) => v.file.includes("nested.ts")));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("ignores .d.ts files", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "portability-test-"));
    try {
      writeFileSync(join(tempDir, "types.d.ts"), "declare const Buffer: any;");

      const result = checkCorePortability(tempDir);
      assert.equal(result.success, true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
