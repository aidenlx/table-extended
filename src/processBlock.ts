import { MarkdownPostProcessorContext } from 'obsidian';
import MarkdownIt from 'markdown-it'
import mTable from 'markdown-it-multimd-table'

export function processBlock(
  src: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const md = MarkdownIt().use(mTable, {
    multiline:  true,
    rowspan:    true,
    headerless: true,
  })
  const result = md.render(src);
  console.log(result)
}


// const html = require('markdown-it')()
//     .use(require('markdown-it-wikilinks')({
//         baseURL: '',
//         relativeBaseURL: '',
//         uriSuffix: '',
//         htmlAttributes: {
//             "class": "internal-link",
//             "rel": "noopener",
//             "target": "_blank",
//         },
//     }))
//     .render('[[#Main Page]]')
// console.log(html)
