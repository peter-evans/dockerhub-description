import {truncateToBytes} from '../src/utils'

describe('truncate to bytes tests', () => {
  test('unicode aware truncation to a number of bytes', async () => {
    expect(truncateToBytes('test string to be truncated', 10)).toEqual(
      'test strin'
    )
    expect(truncateToBytes('😀😁😂🤣😃😄😅', 10)).toEqual('😀😁')
  })
})
