# uCNC-webconfig
This is the second version of the configuration WebApp for µCNC

## Firmware defaults

Board and HAL defaults use a manifest-first hybrid loader that remains fully compatible with GitHub Pages:

1. `manifests/<ref>/defaults.json` is loaded when a compiler-generated manifest exists.
2. Arbitrary tags, branches, and commits fall back to the browser C-preprocessor subset in `preprocessor.js`.
3. Every manifest records the requested ref, resolved commit, generator, and external SDK headers that were stubbed while resolving uCNC-owned macros.

The Pages workflow regenerates manifests for every firmware ref listed in `options.js` on pushes to `master`, manual dispatches, and a weekly schedule. Tags remain pinned to their commit while moving branches such as `master` are refreshed.

To generate one manifest locally, check out uCNC separately and run:

```sh
node scripts/generate-manifests.mjs \
  --ucnc-dir ../uCNC \
  --ref master \
  --output manifests
```

Set `CPP` or `CC` to choose a C-compatible preprocessor. The generator defaults to `cc`.

Run all regression tests with:

```sh
node --test
```
