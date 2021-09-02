import * as core from '@actions/core'
import * as inputHelper from './input-helper'
import * as dockerhubHelper from './dockerhub-helper'
import * as fs from 'fs'
import {inspect, TextEncoder} from 'util'

const MAX_BYTES = 25000

async function run(): Promise<void> {
  try {
    const inputs = inputHelper.getInputs()
    core.debug(`Inputs: ${inspect(inputs)}`)

    inputHelper.validateInputs(inputs)

    // Fetch the readme content
    const readmeContent = await fs.promises.readFile(inputs.readmeFilepath, {
      encoding: 'utf8'
    })
    const byteLength = new TextEncoder().encode(readmeContent).length
    if (byteLength > MAX_BYTES) {
      throw new Error(
        `File size exceeds the maximum allowed ${MAX_BYTES} bytes`
      )
    }

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
  } catch (error: any) {
    core.debug(inspect(error))
    core.setFailed(error.message)
  }
}

run()
