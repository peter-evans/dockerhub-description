import {getInputs} from '../src/input-helper'

describe('input-helper tests', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {...ORIGINAL_ENV}
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  test('enableUrlCompletion should be false when "false" is passed', () => {
    process.env['INPUT_ENABLE-URL-COMPLETION'] = 'false'

    const inputs = getInputs()
    expect(inputs.enableUrlCompletion).toBe(false)
  })

  test('enableUrlCompletion should be true when "true" is passed', () => {
    process.env['INPUT_ENABLE-URL-COMPLETION'] = 'true'

    const inputs = getInputs()
    expect(inputs.enableUrlCompletion).toBe(true)
  })
})
