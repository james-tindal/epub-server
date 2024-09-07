import server from 'server'
import { resolve as concat_path } from 'node:path'
import { fileURLToPath } from 'url'

import { router } from './router.js'

const project_dir = fileURLToPath(import.meta.resolve('..'))
const relative_path = path => concat_path(project_dir, path)


server({
  port: 65535,
  views: relative_path('src/views'),
  public: relative_path('public'),  
  favicon: relative_path('public/favicon.ico'),
}, router)
.then(ctx => console.log(`Listening on http://localhost:65535/`))
.catch(e => { throw e })
