import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURES_ROOT = fileURLToPath(new URL("../fixtures/", import.meta.url));
const FIXTURES_ROOT_PREFIX = FIXTURES_ROOT.endsWith(sep) ? FIXTURES_ROOT : `${FIXTURES_ROOT}${sep}`;

export async function readFixture(relPath: string): Promise<Uint8Array> {
  const abs = resolve(FIXTURES_ROOT, relPath);
  if (!abs.startsWith(FIXTURES_ROOT_PREFIX)) {
    throw new Error(`readFixture: path escapes fixtures root: ${relPath}`);
  }

  try {
    const buf = await readFile(abs);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    throw new Error(`readFixture: not found: ${relPath}`);
  }
}
