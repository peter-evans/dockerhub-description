import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {getReadmeContent, getReadmeFrontmatter} from '../src/readme-helper'

function writeReadme(dir: string, content: string): string {
  const p = path.join(dir, 'README.md')
  fs.writeFileSync(p, content, 'utf8')
  return p
}

describe('frontmatter parsing', () => {
  let tmpdir: string

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-'))
  })

  afterEach(() => {
    fs.rmSync(tmpdir, {recursive: true, force: true})
  })

  test('getReadmeFrontmatter returns parsed keys when frontmatter is present', () => {
    const p = writeReadme(
      tmpdir,
      [
        '---',
        'short-description: my image',
        'enable-url-completion: true',
        'image-extensions:',
        '  - png',
        '  - svg',
        '---',
        '# body',
        ''
      ].join('\n')
    )
    expect(getReadmeFrontmatter(p)).toEqual({
      'short-description': 'my image',
      'enable-url-completion': true,
      'image-extensions': ['png', 'svg']
    })
  })

  test('getReadmeFrontmatter accepts inline-array form for image-extensions', () => {
    const p = writeReadme(
      tmpdir,
      '---\nimage-extensions: [png, svg, webp]\n---\n# body\n'
    )
    expect(getReadmeFrontmatter(p)).toEqual({
      'image-extensions': ['png', 'svg', 'webp']
    })
  })

  test('getReadmeFrontmatter returns an empty object when no frontmatter block is present', () => {
    const p = writeReadme(tmpdir, '# just a heading\n\nbody\n')
    expect(getReadmeFrontmatter(p)).toEqual({})
  })

  test('getReadmeFrontmatter throws with a field-level message on wrong-typed values', () => {
    // `"false"` (quoted) parses as a string; the schema expects a
    // boolean. Without validation this would silently enable URL
    // completion (truthy string).
    const p = writeReadme(
      tmpdir,
      '---\nenable-url-completion: "false"\n---\n# body\n'
    )
    expect(() => getReadmeFrontmatter(p)).toThrow(
      /enable-url-completion.*boolean/i
    )
  })

  test('getReadmeFrontmatter preserves unknown keys via passthrough', () => {
    // Unknown keys belong to other tools; we don't consume them but
    // also don't want to reject a readme that carries them.
    const p = writeReadme(
      tmpdir,
      '---\nshort-description: X\ncustom-key: whatever\n---\n# body\n'
    )
    const fm = getReadmeFrontmatter(p) as Record<string, unknown>
    expect(fm['short-description']).toBe('X')
    expect(fm['custom-key']).toBe('whatever')
  })

  test('a lone `---` (no closing delimiter) is not treated as frontmatter', () => {
    // gray-matter only recognises a properly closed block; a bare `---`
    // at the top is left in the body as a horizontal rule.
    const p = writeReadme(tmpdir, '---\n# body\n')
    expect(getReadmeFrontmatter(p)).toEqual({})
  })

  test('getReadmeContent strips the frontmatter block from the returned body', async () => {
    const p = writeReadme(
      tmpdir,
      '---\nshort-description: X\n---\n# body\n\nsome text\n'
    )
    const content = await getReadmeContent(p, false, 'png')
    expect(content).not.toContain('short-description')
    expect(content).not.toMatch(/^---/)
    expect(content).toContain('# body')
    expect(content).toContain('some text')
  })

  test('getReadmeContent leaves plain markdown untouched', async () => {
    const raw = '# heading\n\nsome body text.\n'
    const p = writeReadme(tmpdir, raw)
    const content = await getReadmeContent(p, false, 'png')
    expect(content).toBe(raw)
  })
})
