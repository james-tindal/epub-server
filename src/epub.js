import { once } from 'node:events'
import EPub from 'epub'
import { file_path } from './cli.js'


const epubGetter = new EPub(file_path)
const epubGot = once(epubGetter, 'end')
epubGetter.parse()

const get_pagination = path => {
  const { flow } = epubGetter
  const i = flow.findIndex(x => x.href == path)
  const get_href = x => x && '/' + x.href
  return {
    previous: get_href(flow[i-1]),
    next:     get_href(flow[i+1]) }
}

const get_file = _path => {
  const path = _path.slice(1)
  const body = epubGetter.zip.admZip.readFile(path)
  const extension = path.match(/.\.([^.]*)$/)?.[1]
  const no_ext = extension === undefined
  const is_html = ['html', 'xhtml', 'htm'].includes(extension)
  const pagination = is_html && get_pagination(path)

  return epubGetter.zip.names.includes(path)
  ? Promise.resolve({ path, body, extension, no_ext, is_html, pagination })
  : Promise.reject()
}

export default epubGot.then(() => ({
  title: epubGetter.metadata.title,
  author: epubGetter.metadata.creator,
  toc: format_toc(epubGetter),
  get_file
}))
.catch(e => {throw e})

function format_toc(epubGetter) {
  const last = arr => arr[arr.length-1]
  const acc = []
  const iter = epubGetter.toc[Symbol.iterator]()
  for (
    let cursor = acc, level = 0, next = iter.next(), item = next.value;
    !next.done;
    cursor.push({ href: item.href, title: item.title, children: item.children }),
    next = iter.next(), item = next.value
  ) {
    if (item.level > level) Open()
    if (item.level < level) Close()
  
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
  return acc
}
