<p align="center">
  <img src="icon.svg" alt="Canary Wallet Logo" width="21%">
</p>

# Canary Wallet on StartOS

> Everything not listed in this document should behave the same as upstream
> Canary Wallet. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Canary Wallet](https://github.com/schjonhaug/canary/) is a Bitcoin wallet watcher: it tracks addresses and descriptors and tells you when they move, reading everything from an Electrum server rather than from a third party. This package runs it in self-hosted mode, wires it to whichever Electrum server you run, and points its transaction links at your own block explorers if you have any.

- **Upstream repo:** <https://github.com/privkeyio/canary> (a fork of <https://github.com/schjonhaug/canary>)
- **Wrapper repo:** <https://github.com/privkeyio/canary-startos> (a fork of <https://github.com/Start9-Community/canary-startos>)

This package builds Canary Wallet from a fork that supports Bitcoin's change of proof of work to BLAKE2b, and only accepts the BLAKE2b flavor of Fulcrum. See [BLAKE2b Proof of Work](#blake2b-proof-of-work).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [BLAKE2b Proof of Work](#blake2b-proof-of-work)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images, both built from source out of the `canary` submodule when the package is packed, so nothing is pulled from a registry at install time. The application ships its front end and back end separately, and so does this package.

| Property      | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Images        | `backend` from `canary/backend`, `frontend` from `canary/frontend` |
| Architectures | `x86_64` and `aarch64`                                             |
| Entrypoint    | Each image's own, via `sdk.useEntrypoint()`                        |

The front end is built with `NEXT_PUBLIC_CANARY_MODE=self-hosted`. Next.js resolves `NEXT_PUBLIC_*` at compile time, and the front end's proxy gates the whole self-hosted sign-in path on it, so it is a build argument rather than runtime environment.

| Subcontainer  | Purpose                                                             |
| ------------- | ------------------------------------------------------------------- |
| `backend-sub` | The server — the only one with a volume, and where the work happens |
| `web-sub`     | The front end, which mounts nothing                                 |

The two share the service network namespace, so the front end reaches the server over loopback and neither the server's port nor anything else is exported.

## Volume and Data Layout

One volume, mounted into the back end only. Before the server starts, an
idempotent root oneshot restores ownership of the mounted volume to the
image's unprivileged `canary` user; StartOS presents service volumes as
root-owned when they are mounted.

| Volume | Mount Point | Purpose                                       |
| ------ | ----------- | --------------------------------------------- |
| `main` | `/app/data` | The application's data, and the package store |

The front end is stateless and mounts nothing — everything worth keeping is written by the server into this one directory.

## File Models

One model, holding the things upstream cannot decide for itself.

| File         | Format | Modelled                | Written by                               |
| ------------ | ------ | ----------------------- | ---------------------------------------- |
| `store.json` | JSON   | Yes — `FileHelper.json` | Init, both actions, and the ntfy watcher |

- **`electrum`** — which Electrum server to use: `fulcrum`, or unset. `electrs` is still accepted when read, since an older install may hold it, and the update clears it so the task asks for Fulcrum. This one field drives the dependency, the task, and the server's Electrum URL all at once.
- **`adminPassword`** — the web login password, set by an action and passed to the server as environment.
- **`jwtSecret`** — the session signing secret. It has a **generated default** rather than being seeded explicitly, so it exists from the first read and never needs an install step.
- **`ntfy`** — cached output of ntfy's Provision Publisher (`publishUrl`, `token`, `topic`). Written by init when ntfy is running, and cleared on backup restore or when ntfy is uninstalled. The action mints a new token on every run, so the cache is what makes auto-provisioning survive restarts.

All four are read reactively, so changing any of them re-runs `main` and the server restarts with the new value.

Canary Wallet's own settings are its business and live in the same volume; the package neither seeds nor rewrites them.

## Dependencies

**Four are declared optional.** Fulcrum is required once it is selected as the Electrum server, and ntfy becomes a current dependency only while it is installed.

| Dependency       | Role                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Fulcrum          | Required, `kind: 'running'`, when selected as the Electrum server |
| Mempool          | Never required — used only for explorer links, if installed       |
| Bitcoin Explorer | Never required — used only for explorer links, if installed       |
| ntfy             | Declared `kind: 'exists'`, only while ntfy itself is installed    |

**Canary Wallet cannot run without an Electrum server.** The choice is not defaulted, so until Fulcrum is selected no Electrum dependency is enabled and a task is raised instead. Once selected, Fulcrum becomes a hard `running` dependency with its own health checks required. An installed ntfy service is declared independently of that choice.

**Only the BLAKE2b flavor of Fulcrum satisfies it** (`>=#blake:2.1.3:1`). A version range names one flavor, so the standard Fulcrum never matches, which is the point: past the activation height it stops rather than serving the 164 byte headers this build reads. **Electrs is not offered**, because no StartOS package of it follows BLAKE2b.

The selected server's address is resolved over the internal bridge, pinned to the **plaintext** leg: Fulcrum publishes a plaintext and a TLS address on that binding, and Canary Wallet speaks the plaintext protocol. Until the selected server's binding exists the address resolves to nothing and the service refuses to start, healing on its own once it appears.

**Mempool and Bitcoin Explorer are a different kind of optional.** They are declared, with any version accepted, but never enabled, so they never become current dependencies; the package simply looks for them and, if present, hands Canary Wallet their browser-reachable addresses so transaction links point at your own explorer instead of a public one. Nothing breaks when they are absent — the links just go elsewhere.

Only addresses a browser can actually open are passed: the internal bridge and loopback are filtered out, and anything that is not HTTP or HTTPS is dropped.

**ntfy is optional until it is installed.** Detection via the UI host is not enough to call Provision Publisher: that action is `access: 'dependent'`, so the package adds ntfy to `current_dependencies` whenever the host exists, and drops it again when ntfy is removed. The declared floor is the first ntfy release whose Provision Publisher accepts dependent callers and returns a bridge publish URL. It does not require ntfy to remain running or healthy. Publisher provisioning is the ntfy dependency's own init handler, which StartOS runs only while ntfy is enabled and after the requirements are published, so registration completes before provisioning even when ntfy is installed later.

When ntfy is running, init calls Provision Publisher with publisher id `canary` and topic `canary`, caches the returned token, and `setupMain` passes `CANARY_NTFY_SERVER_URL`, `CANARY_NTFY_TOKEN`, and `CANARY_NTFY_TOPIC`. Those are defaults: settings saved in Canary Wallet stay authoritative, the wrapper exports the managed token for the application to use with the detected local integration, and wallet contacts are not created automatically. The publish URL is ntfy's live internal bridge address, not the retired `ntfy.startos` hostname. Removing ntfy clears the cache and the environment variables on the next reactive restart.

## Network Access and Interfaces

One interface.

| Interface | Id   | Type | Port | Description                        |
| --------- | ---- | ---- | ---- | ---------------------------------- |
| Web UI    | `ui` | ui   | 3000 | The web interface of Canary Wallet |

Bound on the `ui-multi` MultiHost over HTTP and not masked. The back end listens on 3001 inside the service and is never exported.

A server upgraded from the StartOS 0.3.5 package also carried that version's `web-ui` host. The migration into `#blake:1.7.1:0` retires it, freeing its port; addresses added to it are not moved to `ui-multi`.

At startup, the package reads every enabled browser-reachable URL from this
interface. It passes a preferred HTTPS `.local` URL as `FRONTEND_URL` and all
enabled URLs as `FRONTEND_URLS`, so Canary Wallet's browser-origin checks keep
working when the interface is opened through another enabled StartOS address.

Canary Wallet supports ntfy, encrypted Nostr DMs, and JSON webhooks. Notification events and disclosed content are selected per contact and per method in Canary Wallet; the StartOS wrapper provisions the optional local ntfy publisher described above.

## Installation and First-Run Flow

Install seeds the store and nothing else, then raises **two** critical tasks — and they are genuinely independent, because the service can satisfy neither on its own.

1. **Select an Electrum server.** Until this is set the package declares no dependency, and `main` throws rather than starting.
2. **Set the admin password.** There is no default credential.

The order does not matter, but both are required before the service will run. The Electrum task is raised by a reactive init step, so it appears whenever the selection is missing — including if it is somehow cleared later.

Once running, the server syncs on a fixed interval and the front end serves the interface.

## Actions

Two actions, and between them they are the whole of setup.

### Select Electrum Server

Chooses which Electrum server Canary Wallet reads from. Run it when its task appears, and again to switch servers.

- **Input:** the server. Fulcrum is the only choice, and nothing is preselected until it is stored.
- **What it changes:** `electrum` in the store — and with it the enabled dependency, the resolved server address, and whether the task is raised.
- **Cost:** the service restarts and reconnects to the new server.
- **Repeat safety:** idempotent; the last choice wins.
- **What to expect after switching:** the newly selected server becomes a required running dependency, and the previous one stops being one. Canary Wallet re-reads history from the new server rather than migrating anything.

### Set Admin Password

Sets the password for the web interface. Run it when its task appears, or to rotate the credential.

- **When to run it:** **only while stopped** — the password is read into the server's environment at start, so it is changed between runs rather than under a running server.
- **What it changes:** `adminPassword` in the store.
- **Confirmation:** once a password is set, StartOS warns that it will be replaced before running.
- **Repeat safety:** re-runnable; the last value wins.
- **Outputs:** the password.

## Tasks

Two, both `critical`, and both raised by circumstance rather than only at install.

| Task                   | Severity   | Raised when                    | Cleared when    |
| ---------------------- | ---------- | ------------------------------ | --------------- |
| Select Electrum Server | `critical` | No Electrum server is selected | The action runs |
| Set Admin Password     | `critical` | No admin password is set       | The action runs |

Both are reactive: they are re-raised on any init that finds the value missing, not only on a fresh install. So clearing either value brings its task back rather than leaving the service unstartable with no prompt.

`critical` blocks the service from starting and suspends the ordinary controls, so a fresh install shows the two tasks and nothing else.

## Health Checks

Two checks, one per daemon.

| Check    | Displayed as    | Method                                   | Grace Period |
| -------- | --------------- | ---------------------------------------- | ------------ |
| `server` | "Server"        | An HTTP request to a chain-data endpoint | 60s          |
| `web`    | "Web interface" | Port 3000 is listening                   | default      |

**The server's check is a real query, not a port probe** — it asks for current block headers, which only succeeds once the server has reached the Electrum server. So a failing "Server" check most often means the Electrum server is unreachable or still syncing, rather than Canary Wallet being broken.

The two daemons do not require one another, so the web interface can be up and serving while the server is not ready.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is Canary Wallet's own data plus the store, meaning the watched addresses, the Electrum selection, the admin password, the session secret, and the cached ntfy publisher all travel together.

A restored instance comes back configured and raises no tasks. It does still need its Electrum server present on the new box — the selection is restored, but the dependency has to actually be installed and running there. The restored ntfy publisher cache is cleared once before reactive watchers start. If ntfy is present and running, a publisher is provisioned for that instance; otherwise provisioning waits for ntfy to start. If ntfy is absent, its environment variables are omitted.

## BLAKE2b Proof of Work

Bitcoin's proof of work changes to BLAKE2b at an activation height. This is not a new chain. From that block on, a block header is 164 bytes and its id is a BLAKE2b hash, rather than 80 bytes and SHA256d. A header announces its own form through bit 31 of its version word, so nothing keys off the block height and headers below the activation height are unchanged.

The standard build parses 80 bytes and rejects the rest, so every header lookup fails with `parse failed: data not consumed entirely when explicitly deserializing`, no wallet syncs, and the "Server" health check never passes.

Canary Wallet's own code needs no change. The fix is in two dependencies of the `canary` submodule, pinned by immutable git rev:

| Crate             | Fork                                                                                | What it adds                                                             |
| ----------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `bitcoin`         | [privkeyio/rust-bitcoin](https://github.com/privkeyio/rust-bitcoin)                 | The extended header and its BLAKE2b block id                             |
| `electrum-client` | [privkeyio/rust-electrum-client](https://github.com/privkeyio/rust-electrum-client) | Splits concatenated headers by length rather than a fixed 80 byte stride |

`bdk_wallet` and `bdk_electrum` need no fork; they inherit the fix through `bitcoin`.

### Packaged as a flavor

This is a flavor of the `canary` package rather than a separate one, so it replaces the standard build in place and keeps wallets, metadata, notification settings and the admin password. Nothing is resynced: only header parsing differs and the database format is untouched.

Switching back to the standard build is allowed. Nothing stored is specific to this flavor, so the switch is reversible. The standard build simply cannot sync past the activation height again.

## Limitations and Differences

1. **An Electrum server is mandatory**, and it must be the BLAKE2b flavor of Fulcrum. The selection is a fixed choice, not an arbitrary address.
2. **Mainnet only.** The network is fixed in the package.
3. **The admin password can only be changed while stopped**, because it is read at start-up.
4. **Explorer links depend on what is installed.** With neither Mempool nor Bitcoin Explorer present, links go to mempool.guide, which this build defaults to because it follows BLAKE2b. mempool.space and the other public explorers stay selectable in Canary Wallet's settings, but do not show blocks past the activation height.
5. **Only browser-reachable explorer addresses are used** — internal ones are filtered out, so an explorer reachable only on the bridge contributes nothing.
6. **The sync interval is fixed** and not exposed as a setting.
7. **Local ntfy is package-provisioned when ntfy is installed and running.** Saved Canary Wallet ntfy settings are not overwritten. A previously saved custom URL of `http://ntfy.startos` is no longer the detected server URL; choose the listed local ntfy option to pick up the provisioned publisher. Arbitrary private ntfy or webhook URLs are not trusted by Canary Wallet unless they match a detected integration.

---

## Quick Reference for AI Consumers

```yaml
package_id: canary
image: backend # built from canary/backend; plus frontend from canary/frontend
architectures: [x86_64, aarch64]
subcontainers:
  - backend-sub # the server; holds the volume
  - web-sub # the front end; mounts nothing
volumes:
  main: /app/data
file_models:
  - store.json
startos_managed_env_vars:
  - CANARY_NETWORK
  - CANARY_ELECTRUM_URL
  - CANARY_BIND_ADDRESS
  - CANARY_DATA_DIR
  - CANARY_MODE
  - CANARY_SELF_HOSTED_ADMIN_PASSWORD
  - CANARY_SYNC_INTERVAL
  - JWT_SECRET
  - FRONTEND_URL
  - FRONTEND_URLS
  - CANARY_MEMPOOL_URLS # only when mempool is installed
  - CANARY_BTC_RPC_EXPLORER_URLS # only when bitcoin-explorer is installed
  - CANARY_TX_EXPLORER_PLATFORM # only when either is
  - CANARY_NTFY_SERVER_URL # ntfy bridge URL, only when ntfy is installed
  - CANARY_NTFY_TOKEN # only after Provision Publisher succeeds
  - CANARY_NTFY_TOPIC # only after Provision Publisher succeeds
  - API_URL # front end only
dependencies:
  - fulcrum # BLAKE2b flavor only; required only when selected; kind: running
  - mempool # declared, never enabled; explorer links only
  - bitcoin-explorer # declared, never enabled; explorer links only
  - ntfy # required only while ntfy is installed; kind: exists
interfaces:
  ui: { type: ui, port: 3000 } # the server on 3001 is internal only
actions:
  - select-electrum
  - set-admin-password # only-stopped
tasks:
  - { action: select-electrum, severity: critical }
  - { action: set-admin-password, severity: critical }
health_checks:
  - server # displayed "Server"
  - web # displayed "Web interface"
```
