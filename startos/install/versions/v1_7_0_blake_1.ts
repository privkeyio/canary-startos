import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_7_0_blake_1 = VersionInfo.of({
  version: '#blake:1.7.0:1',
  releaseNotes: `Security update. Stops trusting the emSign certificate authority whose intermediate signing keys have leaked.

Anyone holding those keys can issue a certificate that the previous build would accept for any website. This build no longer trusts them on any connection Canary makes: notifications over ntfy, Telegram, email and webhooks, Nostr relays, exchange rate lookups, and Electrum servers reached over ssl://.

The fix covers the certificate store bundled into Canary, the certificate verifier, and the system certificate store inside the container. The bundled store for Electrum also moves to Mozilla's current list, so an ssl:// Electrum server whose certificate chains only to a root Mozilla has since retired will no longer connect. Connections to Fulcrum on this server use tcp:// and are unaffected.

Also updates dependencies with published security fixes.

Canary itself is unchanged at 1.7.0. Nothing on disk changes, so this is an ordinary update with no resync.`,
  migrations: {
    up: async () => {},
    down: async () => {},
    other: {
      // Arriving from, or returning to, the unflavored build. Nothing to convert either way.
      ['^1']: {
        up: async () => {},
        down: async () => {},
      },
    },
  },
})
