import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_7_0_blake = VersionInfo.of({
  version: '#blake:1.7.0:0',
  releaseNotes: `Builds Canary 1.7.0.

Upstream adds multi-factor authentication for admin accounts, a Telegram notification provider, and a rework of how Electrum subscriptions are kept alive. Nothing on disk changes, so this is an ordinary update.

The extended block header support this flavor exists for is unchanged, and still carried by the patched \`bitcoin\` and \`electrum-client\` crates rather than by Canary itself.`,
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
