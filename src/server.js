import get_epub from './epub.js'
import server from 'server'
const { get } = server.router
const { render, send, status, type } = server.reply

const epub = await get_epub

server({ port: 8080, views: 'src/views', favicon: 'public/favicon.ico' }, [
  get('/', ctx => render('toc.hbs', epub)),
  ctx => {
    const file = epub.get_file(ctx.path.slice(1))
    const ext = ctx.path.match(/.\.([^.]*)$/)?.[1]
    return (
      file == null ? status(404) :
      ext  == null ? send(file) :
                     type(ext).send(file) )}
  ],
)
.then(app => console.log(`Listening on http://localhost:${app.options.port}`))

