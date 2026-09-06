import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_6_2_blake = VersionInfo.of({
  version: '#blake:1.6.2:0',
  releaseNotes: `Canary with support for the BLAKE2b proof-of-work hardfork.

The hardfork changes the proof of work at an activation height: from that block on, block headers are 164 bytes and hashed with BLAKE2b rather than 80 bytes and SHA256d. The standard build cannot parse the new form, so every header lookup fails with "data not consumed entirely when explicitly deserializing" and the sync queue backs up. This one reads both forms, and below the activation height nothing changes.

## Requires the BLAKE2b flavor of Fulcrum

Only Knots schedules the hardfork, and only the BLAKE2b flavor of Fulcrum indexes and serves the extended headers. This build depends on that flavor specifically; the standard Fulcrum no longer satisfies it, because past the activation height it stops rather than serving wrong data.

Electrs is no longer offered as an Electrum server. It has no build that understands the extended headers, so past the activation height it cannot serve this service. An existing install that selected Electrs will ask for a supported server to be chosen.

## Switching to this build

This is a flavor of the same package rather than a separate one, so it replaces the standard build in place and keeps its wallets, metadata and notification settings. Nothing is resynced: only the header parsing changes, and the wallet database format is untouched.

## Switching back

Returning to the standard build is allowed. Nothing in the stored data is specific to this flavor, so the switch is reversible; the standard build simply cannot sync past the activation height again.`,
  migrations: {
    // Nothing to migrate in either direction within this flavor.
    up: async () => {},
    down: async () => {},
    other: {
      // Arriving from, or returning to, the unflavored build. The wallet database and settings are
      // identical between the two, so neither direction has anything to convert and no resync
      // happens. Unlike Fulcrum, there is no on-disk format that only this flavor can read, so the
      // reverse switch is left available rather than blocked.
      ['^1']: {
        up: async () => {},
        down: async () => {},
      },
    },
  },
})
