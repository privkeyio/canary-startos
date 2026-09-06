import { selectElectrum } from './actions/selectElectrum'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  const electrum = await storeJson.read((s) => s.electrum).const(effects)

  if (electrum === 'fulcrum') {
    return {
      fulcrum: {
        kind: 'running',
        // The BLAKE2b hardfork changes the proof of work at an activation height: from that block
        // on, headers are 164 bytes and hashed with BLAKE2b rather than 80 bytes and SHA256d. Only
        // the `blake` flavor of Fulcrum indexes and serves those headers; the standard build stops
        // at the activation block. Requiring the flavor keeps this from being pointed at a server
        // that will never serve them.
        versionRange: '>=#blake:2.1.2:0',
        healthChecks: ['primary', 'sync-progress'],
      },
    }
  } else {
    await sdk.action.createOwnTask(effects, selectElectrum, 'critical', {
      reason: 'Canary requires an Electrum server to look up addresses',
    })
    return {}
  }
})
