import * as core from '@actions/core'
import * as fetch from 'node-fetch'

export async function getToken(
  username: string,
  password: string
): Promise<string> {
  const body = {
    identifier: username,
    secret: password
  }
  const response = await fetch('https://hub.docker.com/v2/auth/token', {
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
    body['description'] = description
  }
  await fetch(`https://hub.docker.com/v2/repositories/${repository}`, {
    method: 'patch',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }).then(res => {
    if (!res.ok) {
      throw new Error(res.statusText)
    }
  })
}
