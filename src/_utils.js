import { statSync } from 'fs'
import { join  } from 'path'

export const joinPath = join

export const resolvePath = (base, path) => (
  !path || path == 'null' ? null : /^\.{1,2}((\/|\\).*)?$/.test(path) ? joinPath(base, path) : path
)

export const isDirectory = path => { try { return statSync(path).isDirectory() } catch { return false }}
export const isFile = path => { try { return statSync(path).isFile() } catch { return false }}
