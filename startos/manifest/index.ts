import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'canary',
  title: 'Canary Wallet',
  license: 'Elastic-2.0',
  packageRepo: 'https://github.com/privkeyio/canary-startos',
  upstreamRepo: 'https://github.com/privkeyio/canary/',
  marketingUrl: 'https://canarybitcoin.com',
  donationUrl: 'https://canarybitcoin.com/donations',
  description: { short, long },
  volumes: ['main'],
  // Built from the canary submodule, which carries the BLAKE2b header support. The published
  // upstream images cannot read a block header past the activation height.
  images: {
    frontend: {
      source: {
        dockerBuild: {
          workdir: 'canary/frontend',
          dockerfile: 'canary/frontend/Dockerfile',
          // Baked in at build time, not read at runtime: the self-hosted auth path in the
          // frontend's proxy is gated on this and Next.js resolves NEXT_PUBLIC_* at compile time.
          buildArgs: { NEXT_PUBLIC_CANARY_MODE: 'self-hosted' },
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
    backend: {
      source: {
        dockerBuild: {
          workdir: 'canary/backend',
          dockerfile: 'canary/backend/Dockerfile',
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
