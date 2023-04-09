import * as core from '@actions/core'
import * as inputHelper from './input-helper'
import * as dockerhubHelper from './dockerhub-helper'
import * as readmeHelper from './readme-helper'
import * as utils from './utils'
import {inspect} from 'util'

const SHORT_DESCRIPTION_MAX_BYTES = 100

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

    // Truncate the short description if it is too long
    const truncatedShortDescription = utils.truncateToBytes(
      inputs.shortDescription,
      SHORT_DESCRIPTION_MAX_BYTES
    )
    if (truncatedShortDescription.length !== inputs.shortDescription.length) {
      core.warning(
        `The short description exceeds DockerHub's limit and has been truncated to ${SHORT_DESCRIPTION_MAX_BYTES} bytes.`
      )
    }
    core.debug(`Truncated short description: ${truncatedShortDescription}`)

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
      truncatedShortDescription,
      readmeContent
    )
    core.info('Request successful')
  } catch (error) {
    core.debug(inspect(error))
    core.setFailed(utils.getErrorMessage(error))
  }
}

run()
