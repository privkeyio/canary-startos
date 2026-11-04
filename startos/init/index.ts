import { sdk } from '../sdk'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { versionGraph } from '../versions'
import { actions } from '../actions'
import { restoreInit } from '../backups'
import { clearRemovedNtfy, clearRestoredNtfy } from '../localNtfy'
import { seedFiles } from './seedFiles'
import { taskSelectElectrum } from './taskSelectElectrum'
import { watchCredentials } from './watchCredentials'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  setInterfaces,
  clearRestoredNtfy,
  actions,
  dependencies,
  watchCredentials,
  taskSelectElectrum,
  clearRemovedNtfy,
)

export const uninit = sdk.setupUninit(versionGraph)
