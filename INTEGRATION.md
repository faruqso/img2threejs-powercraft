# Local integration guide

This repository contains a source snapshot of
[`hoainho/img2threejs-showcase`](https://github.com/hoainho/img2threejs-showcase)
at upstream commit `35e063501546c7154216dc5b29366d4a0ae219d5`.

The imported application is a Vite + TypeScript + Three.js gallery. It uses a
hash router, so the home route (`#/`) and demo routes (`#/demo/<id>`) work on
static hosts without server-side rewrite rules.

## Run it locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm ci
npm run dev
```

Open the URL Vite prints. Check the gallery, then open at least one detail
route such as `#/demo/sony-wf1000xm3`. Drag to orbit and scroll to zoom.

## Verify the production build

```bash
npm run build
npm run preview
```

Open the preview URL and repeat the gallery/detail-route check. The production
output is written to `dist/`.

The build uses a portable relative base by default. If your host requires an
absolute base, copy `.env.example` to `.env.local` and set, for example:

```dotenv
VITE_BASE_PATH=/your-repository-name/
```

## Point source links at your repository

Existing demo source links intentionally default to the upstream repository.
To point them at your fork or destination repository, set:

```dotenv
VITE_SOURCE_REPO_URL=https://github.com/your-user/your-repository
VITE_SOURCE_BRANCH=main
```

## Add your own model

Scaffold a registry entry and placeholder factory:

```bash
npm run new-demo -- my-model "My Model" object
```

Then provide and add:

1. The img2threejs-generated TypeScript factory (or the reference image from
   which a factory should be built).
2. A reference `.png`, `.jpg`, `.jpeg`, or `.webp` image, no larger than 800 KB.
3. A unique kebab-case ID, display title, and `object` or `character` class.
4. A 1–2 sentence description, author display name, author/profile URL, and
   img2threejs version.
5. Your preferred camera position, target, and field of view—or permission to
   tune those values from the rendered result.

Replace the generated placeholder factory, fill every `TODO` in
`src/demos/registry.ts`, and put the reference image in `public/references/`.
Then run:

```bash
npm run build
node scripts/check-showcase-safety.mjs --files \
  src/demos/my-model/createMyModelModel.ts,public/references/my-model.png,src/demos/registry.ts
npm run preview
```

## Integration notes

- The original procedural models, reference images, sponsor page, author
  metadata, and upstream source links are preserved.
- The upstream hard-coded `/img2threejs-showcase/` Vite base was replaced with
  a portable relative default.
- Vite was upgraded from the upstream 5.x lockfile to 8.1.5 to remove the
  development-server vulnerabilities reported by `npm audit`.
- The upstream CODEOWNERS rules were disabled because they required reviews
  from the upstream author. Add this repository's owner/team in
  `.github/CODEOWNERS` before enabling required code-owner reviews.
- The upstream repository snapshot does not include a `LICENSE` file. Confirm
  the licensing terms you want for this integrated repository before public
  redistribution.
