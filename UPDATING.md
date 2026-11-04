# Updating the upstream version

Canary Wallet's images are built from the `canary` submodule, which tracks [privkeyio/canary](https://github.com/privkeyio/canary): upstream [schjonhaug/canary](https://github.com/schjonhaug/canary) plus the BLAKE2b header support. A bump lands in the app fork first, then here.

## Determining the upstream version

```
gh release view -R schjonhaug/canary --json tagName -q .tagName
```

The Upstream Parity workflow opens an issue when a newer release exists.

## Applying the bump

1. In privkeyio/canary, merge the upstream release tag into `master`, keeping the `[patch.crates-io]` entries in `backend/Cargo.toml`. Regenerate `backend/Cargo.lock` from upstream's and re-run `cargo update -p bitcoin@<upstream version> -p electrum-client` so the patched crates resolve, then confirm `cargo test --locked` passes, including `system_tests/blake2b_hardfork_headers.rs`.
2. Here, point the submodule at the merged commit:

   ```
   git -C canary fetch origin master
   git -C canary checkout <merged commit>
   git add canary
   ```

3. Bump `version` in `startos/versions/current.ts` to `#blake:<new version>:0` and write its release notes.
4. Merge the Start9-Community package's matching update, keeping this fork's deltas: the `#blake` Fulcrum range, no Electrs, and images built from the submodule.
5. `make` and install on a StartOS box, then confirm a wallet syncs and the Server health check passes.
