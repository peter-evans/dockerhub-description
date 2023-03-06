import {completeRelativeUrls, truncateToBytes} from '../src/readme-helper'

describe('complete relative urls tests', () => {
  const GITHUB_SERVER_URL = process.env['GITHUB_SERVER_URL']
  const GITHUB_REPOSITORY = process.env['GITHUB_REPOSITORY']
  const GITHUB_REF_NAME = process.env['GITHUB_REF_NAME']

  const README_FILEPATH = './README.md'
  const EXPECTED_REPOSITORY_URL = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}`
  const EXPECTED_BLOB_URL = `${EXPECTED_REPOSITORY_URL}/blob/${GITHUB_REF_NAME}`
  const EXPECTED_RAW_URL = `${EXPECTED_REPOSITORY_URL}/raw/${GITHUB_REF_NAME}`

  // known issues
  test('reference-style links/image sources are not converted', async () => {
    const content = [
      'table-of-content][toc]',
      '',
      '[toc]: #table-of-content "Table of content"'
    ].join('\n')
    expect(completeRelativeUrls(content, README_FILEPATH, true, '')).toEqual(
      content
    )
  })

  test('links containing square brackets in the text fragment are not converted', async () => {
    expect(
      completeRelativeUrls(
        '[[text with square brackets]](README.md)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual('[[text with square brackets]](README.md)')
  })

  test('links containing square brackets in the text fragment are not converted', async () => {
    expect(
      completeRelativeUrls('`[text](README.md)`', README_FILEPATH, true, '')
    ).toEqual(`\`[text](${EXPECTED_BLOB_URL}/README.md)\``)
  })

  // misc
  test('do not change content when disabled', async () => {
    expect(
      completeRelativeUrls('[text](README.md)', README_FILEPATH, false, '')
    ).toEqual('[text](README.md)')
  })

  test('do not change link with mailto protocol', async () => {
    expect(
      completeRelativeUrls(
        '[text](mailto:mail@example.com)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](mailto:mail@example.com)`)
  })

  test('do not change link with ftp protocol', async () => {
    expect(
      completeRelativeUrls(
        '[text](ftp://example.com)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](ftp://example.com)`)
  })

  test('do not change link with http protocol', async () => {
    expect(
      completeRelativeUrls(
        '[text](http://example.com)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](http://example.com)`)
  })

  test('do not change link with https protocol', async () => {
    expect(
      completeRelativeUrls(
        '[text](https://example.com)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](https://example.com)`)
  })

  test('do not change link with protocol-like beginning', async () => {
    expect(
      completeRelativeUrls(
        '[text](abc://example.com)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](abc://example.com)`)
  })

  test('do not change image from absolute source with absolute link', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](https://example.com/image.svg)](https://example.com/image.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](https://example.com/image.svg)](https://example.com/image.svg)`
    )
  })

  // anchors
  test('anchor referencing the current document', async () => {
    expect(
      completeRelativeUrls(
        '[text](#relative-anchor)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](${EXPECTED_BLOB_URL}/README.md#relative-anchor)`)
  })

  test('anchor referencing the current document with a title', async () => {
    expect(
      completeRelativeUrls(
        '[text](#relative-anchor "the anchor (a title)")',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(
      `[text](${EXPECTED_BLOB_URL}/README.md#relative-anchor "the anchor (a title)")`
    )
  })

  test('anchor referencing the current document with a title and unicode', async () => {
    expect(
      completeRelativeUrls(
        '[text with 🌬](#relative-anchor "the anchor (a title with 🌬)")',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(
      `[text with 🌬](${EXPECTED_BLOB_URL}/README.md#relative-anchor "the anchor (a title with 🌬)")`
    )
  })

  test('anchor referencing another document', async () => {
    expect(
      completeRelativeUrls(
        '[text](OTHER.md#absolute-anchor)',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(`[text](${EXPECTED_BLOB_URL}/OTHER.md#absolute-anchor)`)
  })

  test('anchor referencing another document with a title', async () => {
    expect(
      completeRelativeUrls(
        '[text](OTHER.md#absolute-anchor "the anchor (a title)")',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(
      `[text](${EXPECTED_BLOB_URL}/OTHER.md#absolute-anchor "the anchor (a title)")`
    )
  })

  test('anchor with image referencing the current document', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](image.svg)](#absolute-anchor "the anchor (a title)")',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](${EXPECTED_RAW_URL}/image.svg)](${EXPECTED_BLOB_URL}/README.md#absolute-anchor "the anchor (a title)")`
    )
  })

  test('anchor with image referencing another document', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](image.svg)](OTHER.md#absolute-anchor "the anchor (a title)")',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](${EXPECTED_RAW_URL}/image.svg)](${EXPECTED_BLOB_URL}/OTHER.md#absolute-anchor "the anchor (a title)")`
    )
  })

  // documents
  test('text document', async () => {
    expect(
      completeRelativeUrls('[text](document.yaml)', README_FILEPATH, true, '')
    ).toEqual(`[text](${EXPECTED_BLOB_URL}/document.yaml)`)
  })

  test('pdf document', async () => {
    expect(
      completeRelativeUrls('[text](document.pdf)', README_FILEPATH, true, '')
    ).toEqual(`[text](${EXPECTED_BLOB_URL}/document.pdf)`)
  })

  test('document with a title', async () => {
    expect(
      completeRelativeUrls(
        '[text](document.pdf "the document (a title)")',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(
      `[text](${EXPECTED_BLOB_URL}/document.pdf "the document (a title)")`
    )
  })

  test('document with a title and unicode', async () => {
    expect(
      completeRelativeUrls(
        '[text with 🌬](document.pdf "the document (a title with 🌬)")',
        README_FILEPATH,
        true,
        ''
      )
    ).toEqual(
      `[text with 🌬](${EXPECTED_BLOB_URL}/document.pdf "the document (a title with 🌬)")`
    )
  })

  // images
  test('image with supported file extension', async () => {
    expect(
      completeRelativeUrls(
        '![alttext](image.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(`![alttext](${EXPECTED_RAW_URL}/image.svg)`)
  })

  test('image with unsupported file extension', async () => {
    expect(
      completeRelativeUrls(
        '![alttext](image.svg)',
        README_FILEPATH,
        true,
        'jpeg'
      )
    ).toEqual(`![alttext](${EXPECTED_BLOB_URL}/image.svg)`)
  })

  test('image without alternate text', async () => {
    expect(
      completeRelativeUrls('![](image.svg)', README_FILEPATH, true, 'svg')
    ).toEqual(`![](${EXPECTED_RAW_URL}/image.svg)`)
  })

  test('image with a title', async () => {
    expect(
      completeRelativeUrls(
        '![alttext](image.svg "the image (a title)")',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(`![alttext](${EXPECTED_RAW_URL}/image.svg "the image (a title)")`)
  })

  test('image with relative link', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](image.svg)](image.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](${EXPECTED_RAW_URL}/image.svg)](${EXPECTED_BLOB_URL}/image.svg)`
    )
  })

  test('image with a title, unicode and relative link', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext with 🌬](image.🌬.svg "the image.🌬.svg (a title)")](image.🌬.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext with 🌬](${EXPECTED_RAW_URL}/image.🌬.svg "the image.🌬.svg (a title)")](${EXPECTED_BLOB_URL}/image.🌬.svg)`
    )
  })

  test('image from absolute source with relative link', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](https://example.com/image.svg)](image.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](https://example.com/image.svg)](${EXPECTED_BLOB_URL}/image.svg)`
    )
  })

  test('image with absolute link', async () => {
    expect(
      completeRelativeUrls(
        '[![alttext](image.svg)](https://example.com/image.svg)',
        README_FILEPATH,
        true,
        'svg'
      )
    ).toEqual(
      `[![alttext](${EXPECTED_RAW_URL}/image.svg)](https://example.com/image.svg)`
    )
  })
})

describe('truncate to bytes tests', () => {
  test('unicode aware truncation to a number of bytes', async () => {
    expect(truncateToBytes('test string to be truncated', 10)).toEqual(
      'test strin'
    )
    expect(truncateToBytes('😀😁😂🤣😃😄😅', 10)).toEqual('😀😁')
  })
})
