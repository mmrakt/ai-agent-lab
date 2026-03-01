/**
 * build.ts
 *
 * Scans registry/ subdirectories, reads meta.json + file contents,
 * and outputs shadcn-compatible Registry JSON files to public/r/.
 *
 * Output structure:
 *   public/r/registry.json        — shadcn standard index ($schema, name, homepage, items)
 *   public/r/index.json           — legacy index (bundles only, backward compat)
 *   public/r/<pkg>.json           — bundle: all files in a package
 *   public/r/<slug>.json          — individual item per file (flat)
 */

import { readdir, readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

// ── Config ───────────────────────────────────────────────────────────────────

const REGISTRY_NAME = "ai-agent-lab";
const REGISTRY_HOMEPAGE = "https://mmrakt.github.io/ai-agent-lab";

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
  $schema: string;
  name: string;
  type: "registry:file";
  title: string;
  description: string;
  dependencies: string[];
  files: RegistryItemFile[];
}

interface RegistryIndexItemFile {
  path: string;
  type: "registry:file";
  target: string;
}

interface RegistryIndexItem {
  name: string;
  type: "registry:file";
  title: string;
  description: string;
  files: RegistryIndexItemFile[];
}

interface RegistryJson {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryIndexItem[];
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

/** Convert a file name (e.g. "instructions/be.instructions.md") to a URL-safe slug */
function toSlug(fileName: string): string {
  return fileName
    .replace(/\.[^.\/]+$/, "")        // remove last extension
    .replace(/[^a-zA-Z0-9]/g, "-")    // non-alphanumeric → dash
    .replace(/^-+|-+$/g, "")          // trim leading/trailing dashes
    .replace(/-{2,}/g, "-")           // collapse consecutive dashes
    .toLowerCase();
}

/** Assign unique slugs to files, appending extension on collision */
function assignSlugs(files: MetaFile[]): Map<MetaFile, string> {
  const result = new Map<MetaFile, string>();
  const bySlug = new Map<string, MetaFile[]>();

  for (const f of files) {
    const slug = toSlug(f.name);
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), f]);
  }

  for (const [slug, group] of bySlug) {
    if (group.length === 1) {
      result.set(group[0], slug);
    } else {
      for (const f of group) {
        const ext = f.name.match(/\.([^.\/]+)$/)?.[1] ?? "";
        result.set(f, `${slug}-${ext}`);
      }
    }
  }

  return result;
}

/** Convert a slug to a human-readable title */
function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Main Build Logic ─────────────────────────────────────────────────────────

async function build(): Promise<void> {
  console.log("🔍 Scanning registry/ ...");

  await mkdir(OUTPUT_DIR, { recursive: true });

  const entries = await readdir(REGISTRY_DIR);
  const bundles: RegistryItem[] = [];
  const registryItems: RegistryIndexItem[] = [];
  let individualCount = 0;

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

    const allFiles: RegistryItemFile[] = [];
    const slugs = assignSlugs(meta.files);

    for (const fileDef of meta.files) {
      const filePath = join(entryPath, fileDef.name);
      const content = await readFile(filePath, "utf-8");

      const regFile: RegistryItemFile = {
        path: fileDef.name,
        content,
        type: "registry:file",
        target: fileDef.target,
      };
      allFiles.push(regFile);

      // ── Individual item (flat at public/r/<slug>.json) ────────────────
      const slug = slugs.get(fileDef)!;
      const individual: RegistryItem = {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name: slug,
        type: "registry:file",
        title: toTitle(slug),
        description: fileDef.target,
        dependencies: [],
        files: [regFile],
      };

      await writeFile(
        join(OUTPUT_DIR, `${slug}.json`),
        JSON.stringify(individual, null, 2),
        "utf-8",
      );
      console.log(`    📄 ${slug}.json`);

      // Add to registry.json items (without content)
      registryItems.push({
        name: slug,
        type: "registry:file",
        title: toTitle(slug),
        description: fileDef.target,
        files: [
          {
            path: fileDef.name,
            type: "registry:file",
            target: fileDef.target,
          },
        ],
      });
      individualCount++;
    }

    // ── Bundle (all files) ──────────────────────────────────────────────
    bundles.push({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: entry,
      type: "registry:file",
      title: toTitle(entry),
      description: meta.description,
      dependencies: meta.dependencies ?? [],
      files: allFiles,
    });
  }

  // ── Output ────────────────────────────────────────────────────────────────

  // Write bundle JSON files
  for (const bundle of bundles) {
    const outPath = join(OUTPUT_DIR, `${bundle.name}.json`);
    await writeFile(outPath, JSON.stringify(bundle, null, 2), "utf-8");
    console.log(`  ✅ ${outPath}`);
  }

  // Write registry.json (shadcn standard index)
  const registryJson: RegistryJson = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: REGISTRY_NAME,
    homepage: REGISTRY_HOMEPAGE,
    items: registryItems,
  };

  const registryPath = join(OUTPUT_DIR, "registry.json");
  await writeFile(registryPath, JSON.stringify(registryJson, null, 2), "utf-8");
  console.log(`  ✅ ${registryPath}`);

  // Write legacy index.json (bundles only, backward compat)
  const legacyIndex = bundles.map(({ name, type, title, description, dependencies }) => ({
    name,
    type,
    title,
    description,
    dependencies,
  }));

  const indexPath = join(OUTPUT_DIR, "index.json");
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf-8");
  console.log(`  ✅ ${indexPath}`);

  // Write components.json (copy-paste ready for consumers)
  const componentsJson = {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "default",
    tailwind: {
      config: "",
      css: "",
      baseColor: "neutral",
      cssVariables: false,
    },
    rsc: false,
    aliases: {
      utils: "@/lib/utils",
      components: "@/components",
    },
    registries: {
      [`@${REGISTRY_NAME}`]: `${REGISTRY_HOMEPAGE}/r/{name}.json`,
    },
  };

  const publicDir = join(ROOT, "public");

  const componentsPath = join(publicDir, "components.json");
  await writeFile(componentsPath, JSON.stringify(componentsJson, null, 2), "utf-8");
  console.log(`  ✅ ${componentsPath}`);

  // Write minimal tsconfig.json (required by shadcn CLI for path resolution)
  const tsconfig = {
    compilerOptions: {
      baseUrl: ".",
      paths: { "@/*": ["./*"] },
    },
  };
  const tsconfigPath = join(publicDir, "tsconfig.json");
  await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf-8");
  console.log(`  ✅ ${tsconfigPath}`);

  console.log(
    `\n🎉 Built ${bundles.length} bundle(s) + ${individualCount} individual item(s) → public/r/`,
  );
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
