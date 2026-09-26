import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {getCredsFromDockerConfig} from '../src/docker-config'

function writeConfig(dir: string, content: unknown | string): string {
  fs.mkdirSync(dir, {recursive: true})
  const p = path.join(dir, 'config.json')
  fs.writeFileSync(
    p,
    typeof content === 'string' ? content : JSON.stringify(content),
    'utf8'
  )
  return p
}

function b64(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64')
}

describe('getCredsFromDockerConfig', () => {
  let tmpdir: string
  let originalDockerConfig: string | undefined

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-cfg-'))
    originalDockerConfig = process.env['DOCKER_CONFIG']
    process.env['DOCKER_CONFIG'] = tmpdir
  })

  afterEach(() => {
    if (originalDockerConfig === undefined) {
      delete process.env['DOCKER_CONFIG']
    } else {
      process.env['DOCKER_CONFIG'] = originalDockerConfig
    }
    fs.rmSync(tmpdir, {recursive: true, force: true})
  })

  test('returns credentials when the docker.io auth entry is present', () => {
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {auth: b64('alice:s3cret')}
      }
    })
    expect(getCredsFromDockerConfig()).toEqual({
      username: 'alice',
      password: 's3cret'
    })
  })

  test('preserves colons in the password portion', () => {
    // PATs sometimes contain colons — split on the first one only.
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {auth: b64('bob:dckr_pat:has:colons')}
      }
    })
    expect(getCredsFromDockerConfig()).toEqual({
      username: 'bob',
      password: 'dckr_pat:has:colons'
    })
  })

  test('returns null when the config file is absent', () => {
    // No config written in tmpdir.
    expect(getCredsFromDockerConfig()).toBeNull()
  })

  test('returns null when the config is not valid JSON', () => {
    writeConfig(tmpdir, '{not json')
    expect(getCredsFromDockerConfig()).toBeNull()
  })

  test('returns null when there is no docker.io auth entry', () => {
    writeConfig(tmpdir, {
      auths: {
        'ghcr.io': {auth: b64('me:token')}
      }
    })
    expect(getCredsFromDockerConfig()).toBeNull()
  })

  test('returns null when a credHelper is set for Docker Hub', () => {
    // credHelper wins even if an auth entry is also present — docker
    // itself defers to the helper.
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {auth: b64('alice:leftover')}
      },
      credHelpers: {
        'https://index.docker.io/v1/': 'desktop'
      }
    })
    expect(getCredsFromDockerConfig()).toBeNull()
  })

  test('returns null when only a credsStore is set (no inline auth)', () => {
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {}
      },
      credsStore: 'desktop'
    })
    expect(getCredsFromDockerConfig()).toBeNull()
  })

  test('honors inline auth even when credsStore is also configured', () => {
    // Some setups have both; the JSON entry is a valid source for us.
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {auth: b64('alice:s3cret')}
      },
      credsStore: 'desktop'
    })
    expect(getCredsFromDockerConfig()).toEqual({
      username: 'alice',
      password: 's3cret'
    })
  })

  test('returns null when the auth field is not username:password', () => {
    writeConfig(tmpdir, {
      auths: {
        'https://index.docker.io/v1/': {auth: b64('no-colon-here')}
      }
    })
    expect(getCredsFromDockerConfig()).toBeNull()
  })
})
