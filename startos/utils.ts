import { T, utils } from '@start9labs/start-sdk'
import { uiHostId as btcExplorerHostId } from 'bitcoin-explorer-startos/startos/interfaces'
import {
  electrumPort as fulcrumPort,
  mainHostId as fulcrumHostId,
} from 'fulcrum-startos/startos/utils'
import { mainHostId as mempoolHostId } from 'mempool-startos/startos/utils'
import { uiHostId, uiInterfaceId } from './interfaces'
import { sdk } from './sdk'

export const serverPort = 3001
export const uiPort = 3000

// Each supported Electrum server's host id and internal (plaintext) electrum
// port, imported from the server package so canary tracks its binding without
// hardcoding. Keyed by package id (also the dependency id in dependencies.ts).
const electrumBinding = {
  fulcrum: { hostId: fulcrumHostId, internalPort: fulcrumPort },
} as const

/**
 * The selected Electrum server's `tcp://<bridge ip>:<port>` for
 * `CANARY_ELECTRUM_URL` (replaces `${electrum}.startos:50001`). A reactive
 * `.const()` on just the bridge address (doctrine v3): a server update is 0
 * restarts, install/uninstall/port-change is one healing restart. Resolves
 * null until the selected server's binding exists — main.ts throws until then
 * and the `.const()` heals when it appears.
 */
export const getElectrumUrl = async (
  effects: T.Effects,
  electrum: keyof typeof electrumBinding,
) => {
  // Both servers bind electrum as `secure: null` with `addSsl`, publishing a
  // plaintext and a TLS bridge address; we speak `tcp://`, so pin the plaintext.
  const addr = await sdk.host
    .getBridgeAddress(effects, {
      packageId: electrum,
      ...electrumBinding[electrum],
      ssl: false,
    })
    .const()
  return addr && `tcp://${addr}`
}

function isBrowserSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(isBrowserSafeUrl))]
}

// Browser-navigable URLs for an exported interface, excluding the LXC bridge
// and loopback addresses which the user's browser cannot reach.
export function interfaceUrls(
  host: utils.FilledHost | null,
  interfaceId: string,
): string[] {
  const iface =
    host &&
    Object.values(host.bindings)
      .flatMap((binding) => Object.values(binding.interfaces))
      .find((candidate) => candidate.id === interfaceId)

  return iface ? uniqueUrls(iface.addressInfo.nonLocal.format('urlstring')) : []
}

function isPreferredLanOrigin(url: string): boolean {
  const parsed = new URL(url)
  return parsed.protocol === 'https:' && parsed.hostname.endsWith('.local')
}

function selectCanonicalUrl(urls: string[]): string | null {
  return (
    urls.find(isPreferredLanOrigin) ??
    urls.find((url) => new URL(url).protocol === 'https:') ??
    urls[0] ??
    null
  )
}

export async function getFrontendOriginEnv(
  effects: T.Effects,
): Promise<Record<'FRONTEND_URL' | 'FRONTEND_URLS', string>> {
  const urls = await sdk.host
    .getOwn(effects, uiHostId, (host) => interfaceUrls(host, uiInterfaceId))
    .const()
  const canonicalUrl = selectCanonicalUrl(urls)

  if (!canonicalUrl) {
    throw new Error('No browser-reachable Canary Wallet UI origin is available')
  }

  return {
    FRONTEND_URL: canonicalUrl,
    FRONTEND_URLS: urls.join(','),
  }
}

type ExplorerInterface = {
  packageId: 'mempool' | 'bitcoin-explorer'
  // Host id (the sdk.MultiHost.of group) and the interface id exported on it.
  hostId: string
  interfaceId: string
  envVar: 'CANARY_MEMPOOL_URLS' | 'CANARY_BTC_RPC_EXPLORER_URLS'
}

// Adding an explorer is an entry here and nothing else: package id, host id,
// interface id, and the env var Canary reads. Keep the browser-safety filter --
// only addresses a browser can actually reach are handed over.
const explorerInterfaces: ExplorerInterface[] = [
  {
    packageId: 'mempool',
    hostId: mempoolHostId,
    interfaceId: 'webui',
    envVar: 'CANARY_MEMPOOL_URLS',
  },
  {
    packageId: 'bitcoin-explorer',
    hostId: btcExplorerHostId,
    interfaceId: 'ui',
    envVar: 'CANARY_BTC_RPC_EXPLORER_URLS',
  },
]

async function getExplorerUrls(
  effects: T.Effects,
  { packageId, hostId, interfaceId }: ExplorerInterface,
): Promise<string[]> {
  return sdk.host
    .get(effects, { hostId, packageId }, (host) =>
      interfaceUrls(host, interfaceId),
    )
    .const()
    .catch(() => [])
}

export async function getLocalExplorerEnv(
  effects: T.Effects,
): Promise<Record<string, string>> {
  const env: Record<string, string> = {}

  for (const explorerInterface of explorerInterfaces) {
    const urls = await getExplorerUrls(effects, explorerInterface)
    if (urls.length > 0) {
      env[explorerInterface.envVar] = urls.join(',')
    }
  }

  if (Object.keys(env).length > 0) {
    env.CANARY_TX_EXPLORER_PLATFORM = 'startos'
  }

  return env
}
