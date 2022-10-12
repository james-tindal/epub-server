import get_epub from './epub.js'
import server from 'server'
const { get } = server.router
const { render, send, status, type } = server.reply


const epub = await get_epub

const script_template = ({ previous, next }) =>
  `<script id="pagination" type="application/json">
    ${JSON.stringify({ previous, next })}
  </script>
  <script src="/pagination.js"></script>
  </head>`

const insert_script = (html, pagination) =>
  html.toString()
  .replace('</head>', script_template(pagination))

const get_file_from_epub = ctx =>
  epub.get_file(ctx.path)
  .then(
    ({ is_html, no_ext, extension, body, pagination }) =>
      is_html ? type('html').send(insert_script(body, pagination)) :
      no_ext  ? send(body) :
                type(extension).send(body),
    (  ) =>     status(404).render('404.hbs') )

let init_ctx
server.plugins.push({
  name: 'Context stealer',
  init: ctx => init_ctx = ctx
})

const retry_incrementing_port = function retry(err) {
  if (err.code !== 'EADDRINUSE') throw err
  console.log(`Address in use, retrying on port ${++init_ctx.options.port}`)
  const promise = new Promise((resolve, reject) => {
    const server = init_ctx.server.listen(init_ctx.options.port)
    server.on('listening', resolve)
    server.on('error', reject)
  })
  return promise.then(() => init_ctx, retry)
}

server({ port: 8000, views: 'src/views', favicon: 'public/favicon.ico' }, [
  get('/', () => render('toc.hbs', epub)),
  get_file_from_epub
])
.catch(retry_incrementing_port)
.then(ctx => console.log(`Listening on http://localhost:${ctx.options.port}`))
.catch(e => { throw e })

