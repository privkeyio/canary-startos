import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_6_2_blake_1 = VersionInfo.of({
  version: '#blake:1.6.2:1',
  releaseNotes: `Fixes a first install failing with \`Failed to create wallet directory: Permission denied\`.

The server runs as an unprivileged user, but a freshly created volume is owned by root, so on a first install it could not create its wallet directory and exited. An existing install was unaffected, because the directory already existed from an earlier version that ran as root.

Ownership of the volume is now taken before the server starts.`,
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
