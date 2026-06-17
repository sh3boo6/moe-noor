import fs from 'fs'
import path from 'path'

const indexPath = path.join(process.cwd(), '.output', 'public', 'index.html')
const html = fs.readFileSync(indexPath, 'utf-8')

let fixed = html
  .replace(/href="\/([^\/][^"]*)"/g, 'href="./$1"')
  .replace(/src="\/([^\/][^"]*)"/g, 'src="./$1"')

if (html !== fixed) {
  fs.writeFileSync(indexPath, fixed)
  console.log('Fixed relative paths in index.html')
}
