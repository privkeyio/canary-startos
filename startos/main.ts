import { ensureCredentials } from './credentials'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { serverPort, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  /**
   * ======================== Setup (optional) ========================
   *
   * In this section, we fetch any resources or run any desired preliminary commands.
   */
  console.info('Starting Canary!')

  const electrum = await storeJson.read((s) => s.electrum).const(effects)
  const credentials = await ensureCredentials(effects)
  const mountpoint = '/app/data'

  // The browser talks to the Next.js frontend, which forwards the request headers verbatim to the
  // server, so the server sees the browser's real Origin: whichever address StartOS exposes the UI
  // on. It validates that origin and refuses to start without at least one, so pass every exported
  // address rather than a fixed localhost guess.
  const uiOrigins = await sdk.serviceInterface
    .getOwn(effects, 'ui', (iface) => iface?.addressInfo?.format('urlstring') ?? [])
    .const()
  const frontendUrls = [`http://localhost:${uiPort}`, ...uiOrigins].join(',')

  /**
   * ======================== Daemons ========================
   *
   * In this section, we create one or more daemons that define the service runtime.
   *
   * Each daemon defines its own health check, which can optionally be exposed to the user.
   */
  const backendSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'backend' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint,
      readonly: false,
    }),
    'backend-sub',
  )

  return sdk.Daemons.of(effects)
    // The server runs as an unprivileged user, but a freshly created volume is owned by root, so
    // it cannot create its wallet directory on a first install. Take ownership before it starts.
    .addOneshot('chown', {
      subcontainer: backendSub,
      exec: {
        command: ['chown', '-R', 'canary:canary', mountpoint],
        user: 'root',
      },
      requires: [],
    })
    .addDaemon('server', {
      subcontainer: backendSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          CANARY_NETWORK: 'mainnet',
          CANARY_ELECTRUM_URL: `tcp://${electrum}.startos:50001`,
          CANARY_BIND_ADDRESS: `0.0.0.0:${serverPort}`,
          CANARY_DATA_DIR: mountpoint,
          CANARY_MODE: 'self-hosted',
          CANARY_SELF_HOSTED_ADMIN_PASSWORD: credentials.adminPassword,
          CANARY_SYNC_INTERVAL: '60',
          JWT_SECRET: credentials.jwtSecret,
          FRONTEND_URLS: frontendUrls,
        },
      },
      ready: {
        display: 'Server',
        gracePeriod: 60000,
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://localhost:${serverPort}/api/block-headers/current`,
            {
              successMessage: 'The server is ready',
              errorMessage: 'The server is not ready',
            },
          ),
      },
      requires: ['chown'],
    })
    .addDaemon('web', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'frontend' },
        null,
        'web-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          API_URL: `http://localhost:${serverPort}`,
        },
      },
      ready: {
        display: 'Web interface',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: 'The web interface is ready',
            errorMessage: 'The web interface is not ready',
          }),
      },
      requires: [],
    })
})
