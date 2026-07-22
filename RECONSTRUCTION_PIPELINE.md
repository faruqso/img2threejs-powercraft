# Reference reconstruction pipeline

This project pins the upstream [`hoainho/img2threejs`](https://github.com/hoainho/img2threejs)
pipeline as the `tools/img2threejs` Git submodule. It is currently pinned to v1.2.0
(`e8ff28a`). The local commands below intentionally cover the object workflow only.

## Prepare a clone

```bash
git submodule update --init --recursive
```

The pipeline scripts use Python 3.10+ and only the standard library.

## Object workflow

For a new source image at `public/references/my-object.png`:

```bash
npm run reconstruct:probe -- public/references/my-object.png
npm run reconstruct:details -- public/references/my-object.png --mode grid-3x3 --out-dir .reconstruction/my-object/crops --out .reconstruction/my-object/detail-inventory.json
npm run reconstruct:assessment -- "My Object" --image public/references/my-object.png --complexity moderate --out .reconstruction/my-object/assessment.json
npm run reconstruct:spec -- "My Object" --image public/references/my-object.png --assessment .reconstruction/my-object/assessment.json --out .reconstruction/my-object/sculpt-spec.json
npm run reconstruct:validate -- .reconstruction/my-object/sculpt-spec.json --strict-quality
```

Then use the generated inventory/spec to implement the Three.js factory. For material or
camera-sensitive work, also run `reconstruct:pbr` and `reconstruct:camera`; after rendering,
package the supplied image and a matching screenshot with `reconstruct:compare` for visual review.

Do not treat a single image as evidence of hidden geometry. Record missing views as unknowns in the
sculpt spec, or request additional reference angles before adding an inferred feature.
