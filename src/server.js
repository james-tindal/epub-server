import server from 'server'
import { resolve as concat_path } from 'node:path'
import fs, { readFileSync as readFile, writeFileSync as writeFile } from 'node:fs'
import { execSync as exec } from 'node:child_process'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'

import { router } from './router.js'

const project_dir = fileURLToPath(import.meta.resolve('..'))
const relative_path = path => concat_path(project_dir, path)

const localDomain = 'library.local'
const socket = `/tmp/${localDomain}.sock`


const expressPlugin = server.plugins.find(plugin => plugin.name === 'express')
expressPlugin.listen = ctx => new Promise((resolve, reject) => {
  ctx.server = ctx.app.listen(socket, () => {
    ctx.log.debug(`Server started on ${socket}`)
    resolve()
  })
  ctx.close = () => new Promise((res, rej) => {
    ctx.server.close(err => err ? rej(err) : res())
  })
  ctx.server.on('error', err => reject(err))

  async function cleanup() {
    await ctx.close()
    process.exit()
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
})


const nginxConfTemplate = Handlebars.compile(readFile(relative_path('src/nginx-conf.hbs'), { encoding: 'utf-8' }))
const nginxConf = nginxConfTemplate({ localDomain })
writeFile(`/usr/local/etc/nginx/servers/${localDomain}.conf`, nginxConf)
exec('nginx -s reload')


server({
  views: relative_path('src/views'),
  public: relative_path('public'),  
  favicon: relative_path('public/favicon.ico'),
}, router)
.then(ctx => console.log(`Listening on ${socket}`))
.catch(e => { throw e })
