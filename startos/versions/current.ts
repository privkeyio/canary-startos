import { MigrationOpts, VersionInfo } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

// Both steps are idempotent, so every edge into this version can run them. The `web-ui` host is
// left by the StartOS 0.3.5 build of this package, and Electrs is no longer offered here, so a
// stored `electrs` is cleared and the Select Electrum Server task asks for Fulcrum.
const catchUp = async ({ effects }: MigrationOpts) => {
  await sdk.MultiHost.of(effects, 'web-ui').retire()
  if ((await storeJson.read((s) => s.electrum).once()) === 'electrs') {
    await storeJson.merge(effects, { electrum: null })
  }
}

export const current = VersionInfo.of({
  version: '#blake:1.7.1:0',
  releaseNotes: {
    en_US: `Builds Canary 1.7.1 and brings in the StartOS packaging updates made since 1.5.0.

Security: Next.js 16.4.2 fixes two critical remote code execution advisories and a high-severity denial of service in the web interface. Canary does not use the affected features, but update anyway. The images are rebuilt on current Node.js 22 and Debian security updates.

Packaging:
- A local ntfy is set up for notifications when it is installed.
- Links to a local Mempool or Bitcoin Explorer open transactions there.
- Show Login Credentials is replaced by Set Admin Password, which generates a new password and shows it once. An existing password keeps working but can no longer be displayed. If you do not have it saved, stop Canary and run Set Admin Password. Running it also signs out every session.
- Select Electrum Server explains its choice and no longer preselects one.

Without a local explorer, transaction links now open on mempool.guide, which follows BLAKE2b, rather than mempool.space. A saved explorer choice is kept.

Electrs is still not offered, since no StartOS package of it follows BLAKE2b. An install that had selected it is asked to choose Fulcrum.

Nothing on disk changes, so this is an ordinary update with no resync.`,
  },
  migrations: {
    up: catchUp,
    down: async () => {},
    other: {
      // Arriving from, or returning to, the unflavored build. The wallet database and settings are
      // the same in both, so nothing is converted either way.
      '^1': { up: catchUp, down: async () => {} },
    },
  },
})
