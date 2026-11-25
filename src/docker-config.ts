import * as core from '@actions/core'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const DOCKER_HUB_AUTH_KEY = 'https://index.docker.io/v1/'

export interface DockerHubCreds {
  username: string
  password: string
}

interface DockerConfig {
  auths?: Record<string, {auth?: string}>
  credHelpers?: Record<string, string>
}

/**
 * Read Docker Hub credentials from the runner's docker config file
 * (populated by `docker login` or `docker/login-action`).
 *
 * The config path is `$DOCKER_CONFIG/config.json` when the env var is set,
 * otherwise `~/.docker/config.json` — matching docker's own resolution.
 *
 * Returns null on any of these (with a debug log) rather than throwing:
 *   - the config file doesn't exist / isn't readable
 *   - the config is not valid JSON
 *   - there's no auth entry for Docker Hub
 *   - a credential helper is configured for Docker Hub — the actual
 *     secret lives outside the JSON in a platform-specific store, and
 *     shelling out to the helper binary is out of scope here
 *   - the `auth` field is malformed
 *
 * A null return leaves inputHelper's downstream validation to surface a
 * clear "missing credentials" error.
 */
export function getCredsFromDockerConfig(): DockerHubCreds | null {
  const configPath = process.env['DOCKER_CONFIG']
    ? path.join(process.env['DOCKER_CONFIG'], 'config.json')
    : path.join(os.homedir(), '.docker', 'config.json')

  let raw: string
  try {
    raw = fs.readFileSync(configPath, 'utf8')
  } catch (err) {
    core.debug(
      `docker config not readable at ${configPath}: ${(err as Error).message}`
    )
    return null
  }

  let cfg: DockerConfig
  try {
    cfg = JSON.parse(raw)
  } catch {
    core.debug(`docker config at ${configPath} is not valid JSON`)
    return null
  }

  // Credential helpers push the actual secrets out of the JSON file.
  // Extracting them would require running the helper binary (`docker-
  // credential-<name> get`) which is platform- and setup-specific.
  //
  // TODO: support credential helpers by shelling out to
  // `docker-credential-<name>` with `spawnSync` (args array, no shell,
  // avoids injection via the config-supplied helper name). Would
  // benefit Docker Desktop / self-hosted runners with helpers
  // configured; CI runners using `docker/login-action` already get
  // inline auth and take the branch below.
  if (cfg.credHelpers && cfg.credHelpers[DOCKER_HUB_AUTH_KEY]) {
    core.debug(
      `docker config uses a credHelper (${cfg.credHelpers[DOCKER_HUB_AUTH_KEY]}) ` +
        `for Docker Hub; cannot auto-extract credentials`
    )
    return null
  }

  const auth = cfg.auths?.[DOCKER_HUB_AUTH_KEY]?.auth
  if (!auth) {
    core.debug(`no Docker Hub auth entry in ${configPath}`)
    return null
  }

  let decoded: string
  try {
    decoded = Buffer.from(auth, 'base64').toString('utf8')
  } catch {
    core.debug(`Docker Hub auth entry in ${configPath} is not valid base64`)
    return null
  }

  const colon = decoded.indexOf(':')
  if (colon <= 0) {
    core.debug(
      `Docker Hub auth entry in ${configPath} is not in username:password form`
    )
    return null
  }

  return {
    username: decoded.slice(0, colon),
    password: decoded.slice(colon + 1)
  }
}
