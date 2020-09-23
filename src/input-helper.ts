import * as core from '@actions/core'

const README_FILEPATH_DEFAULT = './README.md'

interface Inputs {
  dockerhubUsername: string
  dockerhubPassword: string
  dockerhubRepository: string
  readmeFilepath: string
}

export function getInputs(): Inputs {
  const inputs = {
    dockerhubUsername: core.getInput('dockerhub-username'),
    dockerhubPassword: core.getInput('dockerhub-password'),
    dockerhubRepository: core.getInput('dockerhub-repository'),
    readmeFilepath: core.getInput('readme-filepath')
  }

  // Environment variable input alternatives and their aliases

  if (!inputs.dockerhubUsername && process.env['DOCKERHUB_USERNAME']) {
    inputs.dockerhubUsername = process.env['DOCKERHUB_USERNAME']
  }
  if (!inputs.dockerhubUsername && process.env['DOCKER_USERNAME']) {
    inputs.dockerhubUsername = process.env['DOCKER_USERNAME']
  }

  if (!inputs.dockerhubPassword && process.env['DOCKERHUB_PASSWORD']) {
    inputs.dockerhubPassword = process.env['DOCKERHUB_PASSWORD']
  }
  if (!inputs.dockerhubPassword && process.env['DOCKER_PASSWORD']) {
    inputs.dockerhubPassword = process.env['DOCKER_PASSWORD']
  }

  if (!inputs.dockerhubRepository && process.env['DOCKERHUB_REPOSITORY']) {
    inputs.dockerhubRepository = process.env['DOCKERHUB_REPOSITORY']
  }
  if (!inputs.dockerhubRepository && process.env['DOCKER_REPOSITORY']) {
    inputs.dockerhubRepository = process.env['DOCKER_REPOSITORY']
  }
  if (!inputs.dockerhubRepository && process.env['GITHUB_REPOSITORY']) {
    inputs.dockerhubRepository = process.env['GITHUB_REPOSITORY']
  }

  if (!inputs.readmeFilepath && process.env['README_FILEPATH']) {
    inputs.readmeFilepath = process.env['README_FILEPATH']
  }

  // Set defaults
  if (!inputs.readmeFilepath) {
    inputs.readmeFilepath = README_FILEPATH_DEFAULT
  }

  return inputs
}

function checkRequiredInput(input: string, name: string): void {
  if (!input) {
    throw new Error(`Required input '${name}' is missing.`)
  }
}

export function validateInputs(inputs: Inputs): void {
  checkRequiredInput(inputs.dockerhubUsername, 'dockerhub-username')
  checkRequiredInput(inputs.dockerhubPassword, 'dockerhub-password')
  checkRequiredInput(inputs.dockerhubRepository, 'dockerhub-repository')
}
