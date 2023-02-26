import * as core from '@actions/core'
import * as inputHelper from './input-helper'
import * as dockerhubHelper from './dockerhub-helper'
import * as readmeHelper from './readme-helper'
import {inspect} from 'util'

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

async function run(): Promise<void> {
  try {
    const inputs = inputHelper.getInputs()
    core.debug(`Inputs: ${inspect(inputs)}`)

    inputHelper.validateInputs(inputs)

    // Fetch the readme content
    core.info('Reading description source file')
    const readmeContent = await readmeHelper.getReadmeContent(
      inputs.readmeFilepath,
      inputs.enableUrlCompletion,
      inputs.imageExtensions
    )
    core.debug(readmeContent)

    // Acquire a token for the Docker Hub API
    core.info('Acquiring token')
    const token = await dockerhubHelper.getToken(
      inputs.username,
      inputs.password
    )
    // Send a PATCH request to update the description of the repository
    core.info('Sending PATCH request')
    await dockerhubHelper.updateRepositoryDescription(
      token,
      inputs.repository,
      inputs.shortDescription,
      readmeContent
    )
    core.info('Request successful')
  } catch (error) {
    core.debug(inspect(error))
    core.setFailed(getErrorMessage(error))
  }
}

run()
