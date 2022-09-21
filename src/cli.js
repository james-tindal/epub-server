import path from 'node:path'

const args = process.argv.slice(2)
if (args[0] === undefined) throw Error('Provide a file path')

export const exec_path = process.execPath
export const file_path = path.resolve(args[0])
