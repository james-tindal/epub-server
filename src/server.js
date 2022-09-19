import get_epub from './epub.js'
import server from 'server'
const { get, error } = server.router
const { render, status } = server.reply

const epub = await get_epub

const port = 8080
server({ port, views: 'src/views', favicon: 'public/favicon.ico' }, [
  get('/', ctx => render('toc.hbs', epub)),
  ctx => epub.get_file(ctx.path.slice(1)) ?? status(404)
],
)
console.log(`Listening on http://localhost:${port}`)
