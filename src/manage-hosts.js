import { exec } from 'node:child_process'
import domain from './local-domain.js'


const handleOutput = (operation, command) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ${operation} domain: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`)
      return
    }
    console.log(stdout)
    console.log(`Domain ${operation === 'add' ? 'added' : 'removed'}: ${domain}`)
  })
}

const addDomain = () =>
  handleOutput('add',
    `sudo sh -c "grep -q '${domain}' /etc/hosts || echo '127.0.0.1 ${domain}' >> /etc/hosts"`)


const removeDomain = () =>
  handleOutput('remove',
    `sudo sed -i '' '/${domain}/d' /etc/hosts`)

const isMain = import.meta.url.slice(7) === process.argv[1]
if (isMain) {
  const operation = process.argv[2]
  switch (operation) {
    case 'add':
      addDomain(); break
    case 'remove':
      removeDomain(); break
    default:
      console.log('Usage: node manageHosts.js <add|remove>')
  }
}
