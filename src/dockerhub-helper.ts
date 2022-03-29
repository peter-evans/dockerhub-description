import * as core from '@actions/core'
import * as fetch from 'node-fetch'

const DESCRIPTION_MAX_CHARS = 100

export async function getToken(
  username: string,
  password: string
): Promise<string> {
  const body = {
    username: username,
    password: password
  }
  const response = await fetch('https://hub.docker.com/v2/users/login', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })
  if (!response.ok) {
    throw new Error(
      `Unexpected response: ${response.status} ${response.statusText}`
    )
  }
  const json = await response.json()
  core.setSecret(json['token'])
  return json['token']
}

export async function updateRepositoryDescription(
  token: string,
  repository: string,
  description: string,
  fullDescription: string
): Promise<void> {
  const body = {
    full_description: fullDescription
  }
  if (description) {
    body['description'] = description.slice(0, DESCRIPTION_MAX_CHARS)
  }
  await fetch(`https://hub.docker.com/v2/repositories/${repository}`, {
    method: 'patch',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`
    }
  }).then(res => {
    if (!res.ok) {
      throw new Error(res.statusText)
    }
  })
}

export async function createRepositoryIfNeeded(
  token: string,
  repository: string,
  is_private: boolean
): Promise<void> {
  const response = await fetch(
    `https://hub.docker.com/v2/repositories/${repository}`,
    {
      method: 'head',
      headers: {
        Authorization: `JWT ${token}`
      }
    }
  )
  if (response.status == 404) {
    core.info('Create Dockerhub repository with private flag: ' + is_private)
    const [dh_namespace, dh_name] = repository.split('/')
    const dh_body = {
      namespace: dh_namespace,
      name: dh_name,
      is_private: is_private
    }
    const create_resp = await fetch(`https://hub.docker.com/v2/repositories/`, {
      method: 'post',
      body: JSON.stringify(dh_body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`
      }
    })
    if (!create_resp.ok) {
      const create_status = create_resp.statusText
      const create_json = await create_resp.json()
      throw new Error(create_status + ' - ' + JSON.stringify(create_json))
    }
  } else {
    core.info('Dockerhub repository is already there, go ahead...')
  }
}
