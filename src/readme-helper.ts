import * as core from '@actions/core'
import * as fs from 'fs'

export const README_FILEPATH_DEFAULT = './README.md'
export const IMAGE_EXTENSIONS_DEFAULT = 'bmp,gif,jpg,jpeg,png,svg,webp'
export const ENABLE_URL_COMPLETION_DEFAULT = false

const TITLE_REGEX = `(?: +"[^"]+")?`
const REPOSITORY_URL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}`
const BLOB_PREFIX = `${REPOSITORY_URL}/blob/${process.env['GITHUB_REF_NAME']}/`
const RAW_PREFIX = `${REPOSITORY_URL}/raw/${process.env['GITHUB_REF_NAME']}/`

type Rule = {
  /**
   * all left of the relative url belonging to the markdown image/link
   */
  left: RegExp
  /**
   * relative url
   */
  url: RegExp
  /**
   * part to prefix the relative url with (excluding github repository url)
   */
  absUrlPrefix: string
}

export async function getReadmeContent(
  readmeFilepath: string,
  enableUrlCompletion: boolean,
  imageExtensions: string
): Promise<string> {
  // Fetch the readme content
  let readmeContent = await fs.promises.readFile(readmeFilepath, {
    encoding: 'utf8'
  })

  readmeContent = completeRelativeUrls(
    readmeContent,
    readmeFilepath,
    enableUrlCompletion,
    imageExtensions
  )

  return readmeContent
}

export function completeRelativeUrls(
  readmeContent: string,
  readmeFilepath: string,
  enableUrlCompletion: boolean,
  imageExtensions: string
): string {
  if (enableUrlCompletion) {
    readmeFilepath = readmeFilepath.replace(/^[.][/]/, '')

    // Make relative urls absolute
    const rules = [
      ...getRelativeReadmeAnchorsRules(readmeFilepath),
      ...getRelativeImageUrlRules(imageExtensions),
      ...getRelativeUrlRules()
    ]

    readmeContent = applyRules(rules, readmeContent)
  }

  return readmeContent
}

function applyRules(rules: Rule[], readmeContent: string): string {
  rules.forEach(rule => {
    const combinedRegex = `${rule.left.source}[(]${rule.url.source}[)]`
    core.debug(`rule: ${combinedRegex}`)

    const replacement = `$<left>(${rule.absUrlPrefix}$<url>)`
    core.debug(`replacement: ${replacement}`)

    readmeContent = readmeContent.replace(
      new RegExp(combinedRegex, 'giu'),
      replacement
    )
  })

  return readmeContent
}

// has to be applied first to avoid wrong results
function getRelativeReadmeAnchorsRules(readmeFilepath: string): Rule[] {
  const prefix = `${BLOB_PREFIX}${readmeFilepath}`

  // matches e.g.:
  //    #table-of-content
  //    #table-of-content "the anchor (a title)"
  const url = new RegExp(`(?<url>#[^)]+${TITLE_REGEX})`)

  const rules: Rule[] = [
    // matches e.g.:
    //    [#table-of-content](#table-of-content)
    //    [#table-of-content](#table-of-content "the anchor (a title)")
    {
      left: /(?<left>\[[^\]]+\])/,
      url: url,
      absUrlPrefix: prefix
    },

    // matches e.g.:
    //    [![media/image.svg](media/image.svg)](#table-of-content)
    //    [![media/image.svg](media/image.svg "title a")](#table-of-content "title b")
    {
      left: /(?<left>\[!\[[^\]]*\]\([^)]+\)\])/,
      url: url,
      absUrlPrefix: prefix
    }
  ]

  return rules
}

function getRelativeImageUrlRules(imageExtensions: string): Rule[] {
  const extensionsRegex = imageExtensions.replace(/,/g, '|')
  // matches e.g.:
  //    media/image.svg
  //    media/image.svg "with title"
  const url = new RegExp(
    `(?<url>[^:)]+[.](?:${extensionsRegex})${TITLE_REGEX})`
  )

  const rules: Rule[] = [
    // matches e.g.:
    //    ![media/image.svg](media/image.svg)
    //    ![media/image.svg](media/image.svg "with title")
    {
      left: /(?<left>!\[[^\]]*\])/,
      url: url,
      absUrlPrefix: RAW_PREFIX
    }
  ]

  return rules
}

function getRelativeUrlRules(): Rule[] {
  // matches e.g.:
  //    .releaserc.yaml
  //    README.md#table-of-content "title b"
  //    .releaserc.yaml "the .releaserc.yaml file (a title)"
  const url = new RegExp(`(?<url>[^:)]+${TITLE_REGEX})`)

  const rules: Rule[] = [
    // matches e.g.:
    //    [.releaserc.yaml](.releaserc.yaml)
    //    [.releaserc.yaml](.releaserc.yaml "the .releaserc.yaml file (a title)")
    {
      left: /(?<left>\[[^\]]+\])/,
      url: url,
      absUrlPrefix: BLOB_PREFIX
    },

    // matches e.g.:
    //    [![media/image.svg](media/image.svg)](media/image.svg)
    //    [![media/image.svg](media/image.svg)](README.md#table-of-content "title b")
    //    [![media/image.svg](media/image.svg "title a")](media/image.svg)
    //    [![media/image.svg](media/image.svg "title a")](media/image.svg "title b")
    //    [![media/image.svg](media/image.svg "title a")](README.md#table-of-content "title b")
    {
      left: new RegExp(
        `(?<left>\\[!\\[[^\\]]*\\]\\([^)]+${TITLE_REGEX}\\)\\])`
      ),
      url: url,
      absUrlPrefix: BLOB_PREFIX
    }
  ]

  return rules
}
