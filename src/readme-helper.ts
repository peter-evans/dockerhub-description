import * as core from '@actions/core'
import * as fs from 'fs'
import matter from 'gray-matter'
import {z} from 'zod'
import * as utils from './utils'

export const README_FILEPATH_DEFAULT = './README.md'
export const IMAGE_EXTENSIONS_DEFAULT = 'bmp,gif,jpg,jpeg,png,svg,webp'
export const ENABLE_URL_COMPLETION_DEFAULT = false

// `.passthrough()` so unknown keys (frontmatter this action doesn't
// consume) are left alone rather than erroring — a readme may carry
// metadata for other tools.
const FrontmatterSchema = z
  .object({
    'short-description': z.string().optional(),
    'enable-url-completion': z.boolean().optional(),
    'image-extensions': z.array(z.string()).optional()
  })
  .passthrough()

/**
 * YAML-frontmatter keys recognised on the README. Values fill the
 * corresponding action inputs when the caller left them unset.
 * Shape is validated at runtime by `FrontmatterSchema`, so a bad
 * type (e.g. `enable-url-completion: "false"` quoted as a string)
 * surfaces as a clear parse error rather than misbehaving silently.
 */
export type ReadmeFrontmatter = z.infer<typeof FrontmatterSchema>

// Parse cache — `getReadmeFrontmatter` runs at input-resolution time
// and `getReadmeContent` runs right after, both against the same path.
// The cache lets them share the read + parse. Keyed on absolute path
// so relative and absolute references to the same file collapse to
// one entry.
const parseCache = new Map<string, matter.GrayMatterFile<string>>()

function parseReadme(readmeFilepath: string): matter.GrayMatterFile<string> {
  const key = fs.realpathSync(readmeFilepath)
  const hit = parseCache.get(key)
  if (hit) return hit
  const raw = fs.readFileSync(key, {encoding: 'utf8'})
  const parsed = matter(raw)
  parseCache.set(key, parsed)
  return parsed
}

/**
 * Read the readme and parse any YAML frontmatter block. When absent,
 * returns an empty metadata object. Errors reading the file bubble up;
 * malformed YAML surfaces as a gray-matter error with a clear message.
 * Docker Hub renders `---`-delimited blocks invisibly on the landing
 * page, but we strip anyway so what's uploaded matches what's rendered
 * and consumers of the raw description API see clean content.
 */
export function getReadmeFrontmatter(
  readmeFilepath: string
): ReadmeFrontmatter {
  const raw = parseReadme(readmeFilepath).data
  const parsed = FrontmatterSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid frontmatter in ${readmeFilepath}: ${detail}`)
  }
  return parsed.data
}

const TITLE_REGEX = `(?: +"[^"]+")?`
const REPOSITORY_URL = `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}`
const BLOB_PREFIX = `${REPOSITORY_URL}/blob/${process.env['GITHUB_REF_NAME']}/`
const RAW_PREFIX = `${REPOSITORY_URL}/raw/${process.env['GITHUB_REF_NAME']}/`

const MAX_BYTES = 25000

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
  // `.content` is the readme body, without the frontmatter.
  let readmeContent = parseReadme(readmeFilepath).content

  readmeContent = completeRelativeUrls(
    readmeContent,
    readmeFilepath,
    enableUrlCompletion,
    imageExtensions
  )

  const truncatedReadmeContent = utils.truncateToBytes(readmeContent, MAX_BYTES)
  if (truncatedReadmeContent.length !== readmeContent.length) {
    core.warning(
      `The README content exceeds DockerHub's limit and has been truncated to ${MAX_BYTES} bytes.`
    )
  }

  return truncatedReadmeContent
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
