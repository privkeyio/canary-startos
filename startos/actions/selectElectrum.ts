import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  electrum: Value.select({
    name: i18n('Electrum Server'),
    description: i18n(
      '- Fulcrum: Fulcrum on this server answers address lookups.\nThe server you choose must be installed and running on this server.',
    ),
    values: {
      // Electrs is not offered: no StartOS package of it follows BLAKE2b, and the packaged one
      // stops at the activation height.
      fulcrum: i18n('Fulcrum'),
    },
    default: null,
  }),
})

export const selectElectrum = sdk.Action.withInput(
  'select-electrum',

  async ({ effects }) => ({
    name: i18n('Select Electrum Server'),
    description: i18n(
      'Select which Electrum server to use for address lookups',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const stored = await storeJson.read((s) => s.electrum).once()
    return { electrum: stored === 'fulcrum' ? stored : undefined }
  },

  // the execution function
  async ({ effects, input }) =>
    storeJson.merge(effects, { electrum: input.electrum }),
)
