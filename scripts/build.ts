/**
 * build.ts
 *
 * Scans registry/ subdirectories, reads meta.json + file contents,
 * and outputs Registry JSON files to public/r/.
 */

import { readdir, readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

interface MetaFile {
  name: string;
  target: string;
}

interface Meta {
  description: string;
  dependencies: string[];
  files: MetaFile[];
}

interface RegistryItemFile {
  path: string;
  content: string;
  type: "registry:file";
  target: string;
}

interface RegistryItem {
  name: string;
  type: "registry:file";
  description: string;
  dependencies: string[];
  files: RegistryItemFile[];
}

interface RegistryIndexItem {
  name: string;
  type: "registry:file";
  description: string;
  dependencies: string[];
}

// ── Paths ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname ?? ".", "..");
const REGISTRY_DIR = join(ROOT, "registry");
const OUTPUT_DIR = join(ROOT, "public", "r");

// ── Helpers ──────────────────────────────────────────────────────────────────

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as T;
}

// ── Main Build Logic ─────────────────────────────────────────────────────────

async function build(): Promise<void> {
  console.log("🔍 Scanning registry/ ...");

  const entries = await readdir(REGISTRY_DIR);
  const items: RegistryItem[] = [];

  for (const entry of entries) {
    const entryPath = join(REGISTRY_DIR, entry);
    if (!(await isDirectory(entryPath))) continue;

    const metaPath = join(entryPath, "meta.json");
    let meta: Meta;
    try {
      meta = await readJson<Meta>(metaPath);
    } catch {
      console.warn(`⚠️  Skipping ${entry}: no valid meta.json found`);
      continue;
    }

    console.log(`  📦 ${entry} — ${meta.description}`);

    const files: RegistryItemFile[] = [];

    for (const fileDef of meta.files) {
      const filePath = join(entryPath, fileDef.name);
      const content = await readFile(filePath, "utf-8");

      files.push({
        path: fileDef.name,
        content,
        type: "registry:file",
        target: fileDef.target,
      });
    }

    items.push({
      name: entry,
      type: "registry:file",
      description: meta.description,
      dependencies: meta.dependencies ?? [],
      files,
    });
  }

  // ── Output ───────────────────────────────────────────────────────────────

  await mkdir(OUTPUT_DIR, { recursive: true });

  // Write individual item JSON files
  for (const item of items) {
    const outPath = join(OUTPUT_DIR, `${item.name}.json`);
    await writeFile(outPath, JSON.stringify(item, null, 2), "utf-8");
    console.log(`  ✅ ${outPath}`);
  }

  // Write index.json (metadata only, no file contents)
  const index: RegistryIndexItem[] = items.map(({ name, type, description, dependencies }) => ({
    name,
    type,
    description,
    dependencies,
  }));

  const indexPath = join(OUTPUT_DIR, "index.json");
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
  console.log(`  ✅ ${indexPath}`);

  console.log(`\n🎉 Built ${items.length} registry item(s) → public/r/`);
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
