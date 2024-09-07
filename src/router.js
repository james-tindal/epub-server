import server from 'server'
const { get } = server.router
const { render, send, status, type } = server.reply
import { resolve as concat_path } from 'node:path'
import { homedir } from 'node:os'

import { EpubNotFound, FolderNotFound, get_epub } from './epub.js'


const script_template = ({ previous, next }) =>
  `<script id="pagination" type="application/json">
    ${JSON.stringify({ previous, next })}
  </script>
  <script src="/pagination.js"></script>
  </head>`

const insert_script = (html, pagination) => {
  const h = html.toString()
  return (
    h.match(/<\/head>/i)    ? h.replace(/<\/head>/i   ,            script_template(pagination)) :
    h.match(/<head\s*\/>/i) ? h.replace(/<head\s*\/>/i, '<head>' + script_template(pagination))
                            : h.replace(/<body>/i     , '<head>' + script_template(pagination)) + '<body>' )
}

const calibre_library = concat_path(homedir(), 'Calibre Library')
const colour = {
  green: '\u001b[32m',
  reset: "\u001b[0m"
}


export const router = [
  ({ method, path }) => console.log(colour.green, method, path, colour.reset),
  get('/', () => '<h1>Epub Server</h1>'),
  // get('/:author', async ({ params: { author }}) => {/* Should show list of author's books */}),
  // Table of contents
  get('/:author/:book', async ({ params: { author, book }}) => {
    const epub = await get_epub(calibre_library, author, book)
    // Make this say if the author is not found or only the book
    if (epub == FolderNotFound) return send('Book not found')
    if (epub == EpubNotFound) return send('This book does not have an epub')
    const toc = epub.get_toc()
    return render('toc.hbs', toc)
  }),
  // Internal epub files
  get('/:author/:book/*', async ({ params: { author, book, 0: internalPath } }) => {
    const epub = await get_epub(calibre_library, author, book)
    if (epub == FolderNotFound) return send('Book not found')
    if (epub == EpubNotFound) return send('This book does not have an epub')

    return epub.get_file(internalPath).then(
      ({ is_html, no_ext, extension, body, pagination }) =>
        is_html ? type('html').send(insert_script(body, pagination)) :
        no_ext  ? send(body) :
                  type(extension).send(body),
      (  ) =>     status(404).render('404.hbs') )
  })
]
