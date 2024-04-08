import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { once } from 'node:events'
import EPub from 'epub'


const get_pagination = (epubGetter, baseHref, path) => {
  const { flow } = epubGetter
  const i = flow.findIndex(x => x.href == path)
  const get_href = x => x && baseHref + x.href
  return {
    previous: get_href(flow[i-1]),
    next:     get_href(flow[i+1]) }
}

const get_file = (epubGetter, baseHref) => path => {
  const body = epubGetter.zip.admZip.readFile(path)
  const extension = path.match(/.\.([^.]*)$/)?.[1]
  const no_ext = extension === undefined
  const is_html = ['html', 'xhtml', 'htm'].includes(extension)
  const pagination = is_html && get_pagination(epubGetter, baseHref, path)

  return epubGetter.zip.names.includes(path)
  ? Promise.resolve({ path, body, extension, no_ext, is_html, pagination })
  : Promise.reject()
}

export const FolderNotFound = Symbol()
export const EpubNotFound = Symbol()

export const get_epub = async (calibre_library, author, book) => {
  const folderPath = decodeURI(resolve(calibre_library, author, book))
  const baseHref = `/${author}/${book}/`
  const epubPath = await readdir(folderPath)
  .catch(() => FolderNotFound)
  .then(res => {
    if (res == FolderNotFound) return FolderNotFound
    const epubFileName = res.filter(p => p.endsWith('.epub'))?.[0]
    if (epubFileName) return resolve(folderPath, epubFileName)
    else return EpubNotFound
  })

  if (typeof epubPath != 'string') return epubPath

  const epubGetter = new EPub(epubPath)
  // const epubGot = once(epubGetter, 'end')
  epubGetter.parse()
  // await epubGot
  await once(epubGetter, 'end')


  return {
    get_toc: () => get_toc(epubGetter, baseHref),
    get_file: get_file(epubGetter, baseHref)
  }
}

function get_toc(epubGetter, baseHref) {
  const last = arr => arr[arr.length-1]
  const acc = []
  const iter = epubGetter.toc[Symbol.iterator]()
  for (
    let cursor = acc, level = 0, next = iter.next(), item = next.value;
    !next.done;
    cursor.push({ href: `${baseHref}${item.href}`, title: item.title, children: item.children }),
    next = iter.next(), item = next.value
  ) {
    if    (item.level > level) Open()
    while (item.level < level) Close()
  
    function Open() {
      // Create children array
      const children = last(cursor).children = []
      children.parent = cursor
      cursor = children
      level++
    }
    function Close() {
      cursor = cursor.parent
      level--
    }
  }
  return { toc: acc, ...epubGetter.metadata }
}
