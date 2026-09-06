import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  electrum: Value.select({
    name: 'Electrum Server',
    // Electrs is not offered: it has no build that understands the BLAKE2b hardfork's 164 byte
    // headers, so past the activation height it cannot serve this service.
    values: {
      fulcrum: 'Fulcrum',
    },
    default: 'fulcrum',
  }),
})

export const selectElectrum = sdk.Action.withInput(
  'select-electrum',

  async ({ effects }) => ({
    name: 'Select Electrum Server',
    description: 'Select which Electrum server to use for address lookups',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    // An install from before the BLAKE2b hardfork may have 'electrs' stored, which is no longer
    // offered. Leave the field empty in that case so a supported server has to be chosen.
    const stored = await storeJson.read((s) => s.electrum).once()
    return { electrum: stored === 'fulcrum' ? stored : undefined }
  },

  // the execution function
  async ({ effects, input }) =>
    storeJson.merge(effects, { electrum: input.electrum }),
)
