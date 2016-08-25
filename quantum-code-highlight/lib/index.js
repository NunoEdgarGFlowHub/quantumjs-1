'use strict'
const hljs = require('highlight.js')
const dom = require('quantum-dom')
const quantumSyntax = require('./quantum-syntax.js')
const path = require('path')

// TODO: try and get quantum registered in hljs
hljs.registerLanguage('um', quantumSyntax)

function transforms (opts) {
  const highlightCode = (language, code) => {
    if (language) {
      return hljs.highlight(language, code, true).value
    } else {
      return hljs.highlightAuto(code).value
    }
  }

  const stylesheetAsset = dom.asset({
    url: '/assets/quantum-code-highlight.css',
    file: path.join(__dirname, '../assets/quantum-code-highlight.css'),
    shared: true
  })

  const codeblock = (selection, transform) => {
    const language = selection.ps()
    return dom.create('div')
      .class('quantum-code-highlight-codeblock' + (language ? ' language-' + language : ''))
      .add(dom.create('pre').text(highlightCode(language, selection.cs()), {escape: false}))
      .add(stylesheetAsset)
  }

  const code = (selection, transform) => {
    const language = selection.ps()
    return dom.create('code')
      .class('quantum-code-highlight-code' + (language ? ' language-' + language : ''))
      .text(highlightCode(language, selection.cs()), {escape: false})
      .add(stylesheetAsset)
  }

  return Object.freeze({
    codeblock,
    code
  })
}

module.exports.transforms = transforms