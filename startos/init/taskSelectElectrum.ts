import { selectElectrum } from '../actions/selectElectrum'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const taskSelectElectrum = sdk.setupOnInit(async (effects) => {
  if (await storeJson.read((s) => s.electrum).const(effects)) return
  await sdk.action.createOwnTask(effects, selectElectrum, 'critical', {
    reason: i18n(
      'Canary Wallet requires an Electrum server to look up addresses',
    ),
  })
})
