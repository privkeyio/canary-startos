import { sdk } from '../sdk'
import { selectElectrum } from './selectElectrum'
import { setAdminPassword } from './setAdminPassword'

export const actions = sdk.Actions.of()
  .addAction(selectElectrum)
  .addAction(setAdminPassword)
