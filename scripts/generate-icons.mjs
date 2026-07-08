// Scans the AWS Asset Package, copies every PNG/SVG into `assets/icons/`,
// and writes `src/icons.json` — a manifest the command reads at runtime.
//
// Run with: npm run generate-icons
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_ICONS = path.join(ROOT, "assets", "icons");
const MANIFEST = path.join(ROOT, "src", "icons.json");

// Locate the "Asset-Package_*" directory at the repo root.
async function findAssetPackage() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const dir = entries.find((e) => e.isDirectory() && e.name.startsWith("Asset-Package"));
  if (!dir) throw new Error("Asset-Package_* directory not found at repo root.");
  return path.join(ROOT, dir.name);
}

// Map top-level group folder -> stable id + friendly label.
function classifyGroup(folder) {
  if (folder.startsWith("Architecture-Service")) return { id: "service", label: "Architecture · Service" };
  if (folder.startsWith("Resource")) return { id: "resource", label: "Resource" };
  if (folder.startsWith("Category")) return { id: "category", label: "Category" };
  if (folder.startsWith("Architecture-Group")) return { id: "group", label: "Architecture · Group" };
  return null;
}

function stripPrefix(name) {
  for (const p of ["Arch-Category_", "Arch_", "Res_"]) {
    if (name.startsWith(p)) return name.slice(p.length);
  }
  return name;
}

// Parse a filename (without directories) into { clean, size, theme, ext }.
function parseFile(filename) {
  const ext = path.extname(filename).slice(1).toLowerCase(); // png | svg
  let base = filename.slice(0, -(ext.length + 1));

  let theme = null;
  for (const t of ["Dark", "Light"]) {
    if (base.endsWith(`_${t}`)) {
      theme = t.toLowerCase();
      base = base.slice(0, -(t.length + 1));
      break;
    }
  }

  // Trailing size, with optional retina scale e.g. `_64@5x`.
  let size = null;
  let scale = 1;
  const m = base.match(/_(\d+)(?:@(\d+)x)?$/);
  if (m) {
    size = Number(m[1]);
    if (m[2]) scale = Number(m[2]);
    base = base.slice(0, m.index);
  }

  const px = size ? size * scale : 0;
  const label = size ? `${size}${scale > 1 ? `@${scale}x` : ""}` : "default";
  return { clean: stripPrefix(base), size, scale, px, label, theme, ext };
}

// Category for an entry, derived from its folder / name per group.
function categoryFor(groupId, relParts, clean) {
  if (groupId === "service") return stripPrefix(relParts[1]).replace(/-/g, " "); // Arch_<Category>
  if (groupId === "resource") return stripPrefix(relParts[1]).replace(/-/g, " "); // Res_<Category>
  if (groupId === "category") return clean.replace(/-/g, " "); // the category itself
  return "Group";
}

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (/\.(png|svg)$/i.test(e.name)) out.push(full);
  }
  return out;
}

async function main() {
  const pkg = await findAssetPackage();

  // Fresh assets/icons on every run.
  await fs.rm(ASSETS_ICONS, { recursive: true, force: true });
  await fs.mkdir(ASSETS_ICONS, { recursive: true });

  const files = await walk(pkg);
  const entries = new Map(); // key -> entry

  for (const abs of files) {
    const rel = path.relative(pkg, abs); // e.g. Architecture-Service-Icons_.../Arch_Compute/64/Arch_Amazon-EC2_64.png
    const parts = rel.split(path.sep);
    const group = classifyGroup(parts[0]);
    if (!group) continue;

    const { clean, px, label, theme, ext } = parseFile(path.basename(abs));
    const category = categoryFor(group.id, parts, clean);

    const key = `${group.id}|${category}|${clean}|${theme ?? ""}`;
    let entry = entries.get(key);
    if (!entry) {
      const displayName =
        clean.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim() +
        (theme ? ` (${theme[0].toUpperCase()}${theme.slice(1)})` : "");
      entry = {
        id: key,
        name: displayName,
        group: group.id,
        groupLabel: group.label,
        category,
        theme,
        keywords: Array.from(
          new Set(
            [clean, clean.replace(/[_-]/g, " "), clean.replace(/[_-]/g, ""), category, group.label]
              .flatMap((s) => s.split(/[\s·]+/))
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ),
        png: [], // [{ label, px, path }] sorted desc, largest first
        svg: [],
      };
      entries.set(key, entry);
    }

    // Copy into assets/icons preserving group/category for uniqueness.
    const destDir = path.join(ASSETS_ICONS, group.id, category.replace(/[^\w-]+/g, "-"));
    await fs.mkdir(destDir, { recursive: true });
    const destName = path.basename(abs);
    const dest = path.join(destDir, destName);
    await fs.copyFile(abs, dest);

    const assetRel = path.relative(path.join(ROOT, "assets"), dest).split(path.sep).join("/");
    const bucket = ext === "svg" ? entry.svg : entry.png;
    if (!bucket.some((v) => v.label === label)) bucket.push({ label, px, path: assetRel });
  }

  const bySizeDesc = (a, b) => b.px - a.px || a.label.localeCompare(b.label);
  const list = Array.from(entries.values())
    .filter((e) => e.png.length || e.svg.length)
    .map((e) => ({ ...e, png: e.png.sort(bySizeDesc), svg: e.svg.sort(bySizeDesc) }))
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  await fs.writeFile(MANIFEST, JSON.stringify(list, null, 0));

  const total = list.length;
  const withPng = list.filter((e) => e.png.length).length;
  const withSvg = list.filter((e) => e.svg.length).length;
  console.log(`Wrote ${total} icons to src/icons.json (${withPng} with PNG, ${withSvg} with SVG).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
