import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_7_0_blake = VersionInfo.of({
  version: '#blake:1.7.0:0',
  releaseNotes: `Builds Canary 1.7.0, three upstream releases on from 1.6.2.

Telegram joins Nostr and ntfy as a notification provider. Transaction labels can be imported and exported as BIP-329 from Wallet Details. Nostr NIP-17 delivery can now reach .onion inbox relays through an optional Tor SOCKS proxy.

Sync reliability: Electrum subscriptions are recovered after a wrapped \`NotSubscribed\` error, which was a source of recurring sync timeouts. Private ntfy destinations now work on Docker, LAN and Tailscale URLs, and self-hosted webhooks can reach LAN and localhost services. Sparrow imports accept SLIP-132 keys and descriptors pasted across multiple lines.

Notification identities and delivery errors are redacted from logs, and the argon2 password hashing migration is complete.

Nothing on disk changes, so this is an ordinary update with no resync.

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
