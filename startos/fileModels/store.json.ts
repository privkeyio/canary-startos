import { FileHelper, utils, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  electrum: z.enum(['fulcrum', 'electrs']).nullable().catch(null),
  adminPassword: z.string().optional().catch(undefined),
  // Its value comes from the .catch() default rather than an install-time seed,
  // so it exists on first read with no seeding step. Don't move it into
  // seedFiles, and don't re-roll it: every issued session is signed with it.
  jwtSecret: z
    .string()
    .catch(utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 64 })),
  // Keep minted credentials across restarts; clear on restore or ntfy removal.
  ntfy: z
    .looseObject({
      publishUrl: z.string(),
      token: z.string(),
      topic: z.string(),
    })
    .optional()
    .catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
