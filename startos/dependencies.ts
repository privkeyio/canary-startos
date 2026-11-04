import { storeJson } from './fileModels/store.json'
import { isNtfyInstalled, provisionLocalNtfy } from './localNtfy'
import {
  bitcoinExplorerDescription,
  fulcrumDescription,
  mempoolDescription,
  ntfyDescription,
} from './manifest/i18n'
import { sdk } from './sdk'

const fulcrum = sdk.Dependency.optional('fulcrum', {
  description: fulcrumDescription,
  metadata: {
    title: 'Fulcrum',
    icon: 'https://raw.githubusercontent.com/Start9Labs/fulcrum-startos/refs/heads/master/icon.png',
  },
  // Only the BLAKE2b flavor of Fulcrum indexes and serves the 164 byte headers this build reads.
  // A range names one flavor, so the standard Fulcrum never satisfies it.
  versionRange: '>=#blake:2.1.3:1',
  kind: 'running',
  healthChecks: ['primary', 'sync-progress'],
  enabled: async ({ effects }) =>
    (await storeJson.read((s) => s.electrum).const(effects)) === 'fulcrum',
})

const mempool = sdk.Dependency.optional('mempool', {
  description: mempoolDescription,
  metadata: {
    title: 'Mempool',
    icon: 'https://raw.githubusercontent.com/Start9Labs/mempool-startos/refs/heads/master/icon.svg',
  },
  versionRange: '*',
  kind: 'exists',
  enabled: async () => false,
})

const bitcoinExplorer = sdk.Dependency.optional('bitcoin-explorer', {
  description: bitcoinExplorerDescription,
  metadata: {
    title: 'Bitcoin Explorer',
    icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-explorer-startos/refs/heads/master/icon.svg',
  },
  versionRange: '*',
  kind: 'exists',
  enabled: async () => false,
})

// Provision Publisher is access 'dependent', so it runs only once ntfy is a current dependency.
const ntfy = sdk.Dependency.optional('ntfy', {
  description: ntfyDescription,
  metadata: {
    title: 'ntfy',
    icon: 'https://raw.githubusercontent.com/Start9Labs/ntfy-startos/refs/heads/master/icon.svg',
  },
  // First revision with dependent actions and bridge publish URLs.
  versionRange: '>=2.26.3:0',
  kind: 'exists',
  enabled: async ({ effects }) => isNtfyInstalled(effects),
}).withInit(provisionLocalNtfy)

export const dependencies = sdk.Dependencies.of()
  .addDependency(fulcrum)
  .addDependency(mempool)
  .addDependency(bitcoinExplorer)
  .addDependency(ntfy)
