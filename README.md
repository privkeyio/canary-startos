<p align="center">
  <img src="icon.png" alt="Canary Logo" width="21%">
</p>

# Canary on StartOS

> Everything not listed in this document should behave the same as upstream
> Canary. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

[Canary](https://github.com/schjonhaug/canary) is a watch-only Bitcoin wallet monitor: it tracks descriptors and addresses through an Electrum server and sends a notification when they move. On StartOS it runs two subcontainers, keeps its wallets and metadata on one volume, and depends on an Electrum server chosen by the user.

- **Upstream repo:** <https://github.com/privkeyio/canary> (a fork of <https://github.com/schjonhaug/canary>)
- **Wrapper repo:** <https://github.com/privkeyio/canary-startos>

This package builds Canary from a fork carrying BLAKE2b proof-of-work hard fork support. See [BLAKE2b Hard Fork Support](#blake2b-hard-fork-support).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Health Checks](#health-checks)
- [BLAKE2b Hard Fork Support](#blake2b-hard-fork-support)
- [Limitations and Differences](#limitations-and-differences)
- [Building](#building)

---

## Image and Container Runtime

Both images are built from source out of the `canary` submodule at pack time, so nothing is pulled from a registry at install time. Two subcontainers run the service.

| Image      | Built from                | Dockerfile                   | Runs                      |
| ---------- | ------------------------- | ---------------------------- | ------------------------- |
| `backend`  | `canary/backend`          | `canary/backend/Dockerfile`  | The API server, port 3001 |
| `frontend` | `canary/frontend`         | `canary/frontend/Dockerfile` | The web UI, port 3000     |

Both are built for `x86_64` and `aarch64`.

The frontend is built with `NEXT_PUBLIC_CANARY_MODE=self-hosted`. This is a build-time argument rather than a runtime one: Next.js resolves `NEXT_PUBLIC_*` at compile time, and the frontend's proxy gates the entire self-hosted authentication path on it.

## Volume and Data Layout

One volume, `main`, mounted at `/app/data` in the backend.

| Path                              | Contents                                    |
| --------------------------------- | ------------------------------------------- |
| `/app/data/mainnet/wallets`       | BDK wallet databases                        |
| `/app/data/mainnet/metadata.sqlite` | Transactions, contacts, notification settings |

The frontend is stateless.

## Dependencies

One, and it must be a specific flavor.

| Dependency | Kind      | Version range        | Health checks                | Why                                    |
| ---------- | --------- | -------------------- | ---------------------------- | -------------------------------------- |
| Fulcrum    | `running` | `>=#blake:2.1.2:0`   | `primary`, `sync-progress`   | Address lookups and block headers      |

**The `#blake` flavor is required, not merely preferred.** Past the hard fork's activation height only that build indexes and serves the extended headers; the standard Fulcrum stops at the activation block rather than serving wrong data, so it can never satisfy this package.

**Electrs is not offered.** No build of it understands the extended headers, so past the activation height it cannot serve this service. An install that had previously selected Electrs is asked to choose a supported server.

## Network Access and Interfaces

| Interface | Type | Port | Notes                    |
| --------- | ---- | ---- | ------------------------ |
| `ui`      | `ui` | 3000 | The web interface        |

The browser talks to the frontend, which forwards requests to the backend on `localhost:3001`. Because the frontend forwards request headers verbatim, the backend sees the browser's real origin rather than localhost, and it validates that origin. Every address StartOS exports for the UI is therefore passed to the backend as `FRONTEND_URLS`; the backend refuses to start without at least one.

## Installation and First-Run Flow

1. Install. An Electrum server must be selected before the service will start; this is raised as a critical task.
2. Select Fulcrum. If the `#blake` flavor is not installed, StartOS reports the dependency as unsatisfied.
3. Start. The backend connects to `tcp://fulcrum.startos:50001`, runs its database migrations, and begins syncing each wallet on a 60 second target.

## Actions

| Action                  | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| Select Electrum Server  | Chooses which Electrum server to depend on        |

## Health Checks

| Check          | How                                                        |
| -------------- | ---------------------------------------------------------- |
| Server         | `GET /api/block-headers/current` on the backend             |
| Web interface  | The UI port is listening                                    |

The server check is worth knowing about: it exercises the block header path, which is exactly what the hard fork changes. If the Electrum server is serving headers this package cannot parse, this check is what fails.

## BLAKE2b Hard Fork Support

The hard fork changes the proof of work at an activation height. From that block on, a block header is 164 bytes and its id is a BLAKE2b hash, rather than 80 bytes and SHA256d. A header announces its own form through bit 31 of its version word, so nothing keys off the block height and headers below the activation height are unchanged.

The standard build parses 80 bytes and rejects the rest, so every header lookup fails with `parse failed: data not consumed entirely when explicitly deserializing`, no wallet syncs, and the queue backs up indefinitely.

Canary's own code needs no change. The fix is in two dependencies, pinned by immutable git rev:

| Crate | Fork | What it adds |
| --- | --- | --- |
| `bitcoin` | [privkeyio/rust-bitcoin](https://github.com/privkeyio/rust-bitcoin) | The extended header and its BLAKE2b block id |
| `electrum-client` | [privkeyio/rust-electrum-client](https://github.com/privkeyio/rust-electrum-client) | Splits concatenated headers by length rather than a fixed 80 byte stride |

`bdk_wallet` and `bdk_electrum` need no fork; they inherit the fix through `bitcoin`.

### Packaged as a flavor

This is a flavor of the `canary` package rather than a separate one, so it replaces the standard build in place and keeps wallets, metadata and notification settings. Nothing is resynced: only header parsing differs and the database format is untouched.

Switching back to the standard build is allowed. Nothing stored is specific to this flavor, so the switch is reversible; the standard build simply cannot sync past the activation height again.

## Limitations and Differences

- Electrs is withdrawn as an option, as above.
- The package requires the `#blake` Fulcrum flavor, so it cannot be installed alongside a standard Fulcrum as the selected server.
- Only mainnet is configured.

## Building

```bash
git clone --recurse-submodules https://github.com/privkeyio/canary-startos
cd canary-startos
make            # universal, x86_64 and aarch64
make x86        # x86_64 only
make install    # to the host in ~/.startos/config.yaml
```

Building `aarch64` on an `x86_64` machine needs QEMU registered:

```bash
docker run --privileged --rm tonistiigi/binfmt --install arm64
```
