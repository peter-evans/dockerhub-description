import * as core from '@actions/core'
import * as fetch from 'node-fetch'

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
  const json = await response.json()
  core.setSecret(json['token'])
  return json['token']
}

export async function updateRepositoryDescription(
  token: string,
  repository: string,
  fullDescription: string
): Promise<void> {
  const body = {
    full_description: fullDescription
  }
  await fetch(`https://hub.docker.com/v2/repositories/${repository}`, {
    method: 'patch',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`
    }
  })
}
