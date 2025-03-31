import * as core from '@actions/core'
import * as readmeHelper from './readme-helper'

interface Inputs {
  username: string
  password: string
  repository: string
  shortDescription: string
  readmeFilepath: string
  enableUrlCompletion: boolean
  imageExtensions: string
}

export function getInputs(): Inputs {
  const inputs = {
    username: core.getInput('username'),
    password: core.getInput('password'),
    repository: core.getInput('repository'),
    shortDescription: core.getInput('short-description'),
    readmeFilepath: core.getInput('readme-filepath'),
    enableUrlCompletion: core.getBooleanInput('enable-url-completion'),
    imageExtensions: core.getInput('image-extensions')
  }

  // Environment variable input alternatives and their aliases

  if (!inputs.username && process.env['DOCKERHUB_USERNAME']) {
    inputs.username = process.env['DOCKERHUB_USERNAME']
  }
  if (!inputs.username && process.env['DOCKER_USERNAME']) {
    inputs.username = process.env['DOCKER_USERNAME']
  }

  if (!inputs.password && process.env['DOCKERHUB_PASSWORD']) {
    inputs.password = process.env['DOCKERHUB_PASSWORD']
  }
  if (!inputs.password && process.env['DOCKER_PASSWORD']) {
    inputs.password = process.env['DOCKER_PASSWORD']
  }

  if (!inputs.repository && process.env['DOCKERHUB_REPOSITORY']) {
    inputs.repository = process.env['DOCKERHUB_REPOSITORY']
  }
  if (!inputs.repository && process.env['DOCKER_REPOSITORY']) {
    inputs.repository = process.env['DOCKER_REPOSITORY']
  }

  if (!inputs.shortDescription && process.env['SHORT_DESCRIPTION']) {
    inputs.shortDescription = process.env['SHORT_DESCRIPTION']
  }

  if (!inputs.readmeFilepath && process.env['README_FILEPATH']) {
    inputs.readmeFilepath = process.env['README_FILEPATH']
  }

  if (!inputs.enableUrlCompletion && process.env['ENABLE_URL_COMPLETION']) {
    inputs.enableUrlCompletion =
      process.env['ENABLE_URL_COMPLETION'].toLowerCase() === 'true'
  }

  if (!inputs.imageExtensions && process.env['IMAGE_EXTENSIONS']) {
    inputs.imageExtensions = process.env['IMAGE_EXTENSIONS']
  }

  // Set defaults
  if (!inputs.readmeFilepath) {
    inputs.readmeFilepath = readmeHelper.README_FILEPATH_DEFAULT
  }
  if (!inputs.imageExtensions) {
    inputs.imageExtensions = readmeHelper.IMAGE_EXTENSIONS_DEFAULT
  }
  if (!inputs.repository && process.env['GITHUB_REPOSITORY']) {
    inputs.repository = process.env['GITHUB_REPOSITORY']
  }

  // Enforce lower case, where needed
  inputs.repository = inputs.repository.toLowerCase()
  inputs.imageExtensions = inputs.imageExtensions.toLowerCase()

  return inputs
}

function checkRequiredInput(input: string, name: string): void {
  if (!input) {
    throw new Error(`Required input '${name}' is missing.`)
  }
}

export function validateInputs(inputs: Inputs): void {
  checkRequiredInput(inputs.username, 'username')
  checkRequiredInput(inputs.password, 'password')
}
