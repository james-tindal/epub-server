import get_epub from './epub.js'
import server from 'server'
import fs from 'node:fs/promises'
import path from 'node:path'
const { get } = server.router
const { render, send, status, type } = server.reply

const epub = await get_epub
const pagination_js = await fs.readFile(path.resolve('src/client.js'), 'utf8')

server({ port: 8080, views: 'src/views', favicon: 'public/favicon.ico' }, [
  get('/', ctx => render('toc.hbs', epub)),
  ctx => {
    const path = ctx.path.slice(1)
    const file = epub.get_file(path)
    const ext = path.match(/.\.([^.]*)$/)?.[1]

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
      ext  == 'html' ? type('html').send(insert_script(file)) :
      file == null   ? status(404) :
      ext  == null   ? send(file) :
                       type(ext).send(file) )}
  ],
)
.then(app => console.log(`Listening on http://localhost:${app.options.port}`))

