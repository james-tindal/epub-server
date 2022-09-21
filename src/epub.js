import { once } from 'node:events'
import EPub from 'epub'
import { file_path } from './cli.js'


const epubGetter = new EPub(file_path)
const epubGot = once(epubGetter, 'end')
epubGetter.parse()

export default epubGot.then(() => ({
  title: epubGetter.metadata.title,
  author: epubGetter.metadata.creator,
  toc: toc_formatter(epubGetter),
  get_file: path =>
    epubGetter.zip.names.includes(path) ? epubGetter.zip.admZip.readFile(path) : undefined,
  get_pagination: path => {
    const { flow } = epubGetter
    const i = flow.findIndex(x => x.href == path)
    return { previous: flow[i-1]?.href, next: flow[i+1]?.href }
  }
}))
.catch(e => {throw e})

function toc_formatter(epubGetter) {
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
