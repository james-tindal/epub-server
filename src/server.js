import get_epub from './epub.js'
import server from 'server'
import fs from 'node:fs/promises'
import path from 'node:path'
const { get } = server.router
const { render, send, status, type } = server.reply

const epub = await get_epub
const pagination_js = await fs.readFile(path.resolve('src/client.js'), 'utf8')

let init_ctx
server.plugins.push({
  name: 'Context stealer',
  init: ctx => init_ctx = ctx
})

const app =
server({ port: 8000, views: 'src/views', favicon: 'public/favicon.ico' }, [
  get('/', ctx => render('toc.hbs', epub)),
  ctx => {
    const path = ctx.path.slice(1)
    const file = epub.get_file(path)
    const ext = path.match(/.\.([^.]*)$/)?.[1]

    const is_html = ext => ['html', 'xhtml', 'htm'].includes(ext)

    const script_template = ({ previous, next }, js) =>
      `<script id="pagination" type="application/json">
         ${JSON.stringify({ previous, next })}
       </script>
       <script>${js}</script>
       </head>`

    const insert_script = file =>
      file.toString()
      .replace('</head>', script_template(epub.get_pagination(path), pagination_js))

    return (
      is_html(ext) ? type('html').send(insert_script(file)) :
      file == null ? status(404) :
      ext  == null ? send(file) :
                     type(ext).send(file) )}
  ],
)
.catch(function retry(err) {
  if (err.code !== 'EADDRINUSE') throw err
  console.log(`Address in use, retrying on port ${++init_ctx.options.port}`)
  const promise = new Promise((resolve, reject) => {
    const server = init_ctx.server.listen(init_ctx.options.port)
    server.on('listening', resolve)
    server.on('error', reject)
  })
  return promise.then(() => init_ctx, retry)
})
.then(ctx => console.log(`Listening on http://localhost:${ctx.options.port}`))
.catch(e => { throw e })

