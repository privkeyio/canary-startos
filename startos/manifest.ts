import { setupManifest } from '@start9labs/start-sdk'

export const manifest = setupManifest({
  id: 'canary',
  title: 'Canary',
  license: 'Elastic-2.0',
  packageRepo: 'https://github.com/privkeyio/canary-startos/',
  upstreamRepo: 'https://github.com/privkeyio/canary/',
  marketingUrl: 'https://canarybitcoin.com',
  donationUrl: 'https://canarybitcoin.com/donations',
  docsUrls: [
    'https://github.com/schjonhaug/canary-startos/blob/master/instructions.md',
  ],
  description: {
    short: 'Bitcoin wallet monitoring service with transaction notifications',
    long: `Canary is a self-hosted Bitcoin wallet monitoring service that provides:
- Watch-only wallet management using BDK (Bitcoin Development Kit)
- Real-time transaction notifications via ntfy.sh push notifications
- Support for multipath descriptors (P2WPKH, P2SH, P2TR, P2PKH)
- Deep scanning to detect funds at high address indexes
- Transaction analysis including RBF/CPFP detection
- Multi-language support (English and Norwegian)
- Balance alerts with configurable thresholds

Perfect for monitoring your cold storage wallets or watching family members' wallets.`,
  },
  volumes: ['main'],
  images: {
    frontend: {
      source: {
        dockerTag: 'privkeyio/canary-frontend:v1.6.2-blake2b',
      },
      arch: ['x86_64', 'aarch64'],
    },
    backend: {
      source: {
        dockerTag: 'privkeyio/canary-backend:v1.6.2-blake2b',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {
    fulcrum: {
      optional: true,
      description:
        'Used for syncing wallet data from the Bitcoin blockchain. Requires the BLAKE2b flavor, which is the only build that serves the extended headers used past the hardfork activation height.',
      metadata: {
        icon: 'https://raw.githubusercontent.com/remcoros/fulcrum-startos/refs/heads/update/040-new/icon.png',
        title: 'Fulcrum',
      },
    },
  },
})
