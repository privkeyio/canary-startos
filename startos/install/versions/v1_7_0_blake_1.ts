import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_7_0_blake_1 = VersionInfo.of({
  version: '#blake:1.7.0:1',
  releaseNotes: `Security update. Leaked private keys for emSign intermediate certificates let anyone issue a certificate that the previous build would accept for any website. This build stops trusting the two roots those certificates chain to, emSign ECC Root CA - G3 and AAA Certificate Services, and where Canary verifies certificates itself it also rejects the leaked intermediates by key.

That covers every encrypted connection Canary makes, including notifications over ntfy, Telegram, email and webhooks, Nostr relays, and exchange rate lookups. The fix is in the certificate store bundled into Canary, the certificate verifier, and the system certificate store inside the container.

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
