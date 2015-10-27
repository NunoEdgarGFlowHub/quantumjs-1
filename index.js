/*

     ____                    __                      _
    / __ \__  ______ _____  / /___  ______ ___      (_)____
   / / / / / / / __ `/ __ \/ __/ / / / __ `__ \    / / ___/
  / /_/ / /_/ / /_/ / / / / /_/ /_/ / / / / / /   / (__  )
  \___\_\__,_/\__,_/_/ /_/\__/\__,_/_/ /_/ /_(_)_/ /____/
                                              /___/

  Dom
  ====

  This module provides an api for building up a virtual representation
  of the dom, which can then be stringifyed out to a html string.

*/

var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'))

// utility for creating ids
var uidCounter = 0
function nextId () {
  uidCounter++
  return 'id' + uidCounter
}

// an abstract representation of a dom node
function Element (page, type, uid) {
  this.page = page
  this.parent = undefined
  this.uid = uid
  this.type = type
  this.attrs = {}
  this.content = []
  this.endContent = []
}

function elementyPromise (promise) {
  promise.add = function (el, end) {
    return elementyPromise(promise.then(function (p) {
      return p.add(el, end)
    }))
  }
  promise.append = function (el, end) {
    return elementyPromise(promise.then(function (p) {
      return p.append(el, end)
    }))
  }
  return promise
}

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
}

function escapeHTML (text) {
  return String(text).replace(/[&<>"'\/]/g, function (s) {return entityMap[s]})
}

// sets the unique id (if you need to refer to the element in the future)
Element.prototype.uuid = function (id) {
  if (arguments.length === 0) {
    return this.uid
  } else {
    delete this.page.elements[this.uid]
    this.uid = id
    this.page.elements[this.uid] = this
    return this
  }
}

// sets an attribute for the element
Element.prototype.attr = function (name, value) {
  if (arguments.length === 1) {
    return this.attrs[name]
  } else {
    this.attrs[name] = value
    return this
  }
}

// sets the id for this element
Element.prototype.id = function (id) {
  if (arguments.length === 0) {
    return this.attr('id')
  } else {
    return this.attr('id', id)
  }
}

// sets the class attribute for this element
Element.prototype['class'] = function (cls) {
  if (arguments.length === 0) {
    return this.attr('class') || ''
  } else {
    return this.attr('class', cls)
  }
}

// sets the id for this element
Element.prototype.classed = function (cls, add) {
  var parts = cls.split(' ')

  if (parts.length > 1) {
    var self = this
    if (arguments.length > 1) {
      parts.forEach(function (c) { return self.classed(c, add) })
      return this
    } else {
      return parts.every(function (c) { return self.classed(c) })
    }
  }

  var hasClass = this.class().split(' ').indexOf(cls) !== -1
  if (arguments.length > 1) {
    if (add) {
      if (!hasClass) {
        this.class(this.class() + ' ' + cls)
      }
    } else {
      if (hasClass) {
        var newClass = this.class().split(' ').filter(function (c) { return c !== cls }).join(' ')
        this.class(newClass)
      }
    }
    return this
  } else {
    return hasClass
  }
}

// adds an element to this element, and returns this element
Element.prototype.add = function (element, addToEnd) {
  if (element === undefined) {
    return this
  }
  if (element && element.then) {
    var self = this
    return elementyPromise(element.then(function (el) {
      return self.add(el, addToEnd)
    }))
  }
  element.parent = this
  if (Array.isArray(element)) {
    var self = this
    element.forEach(function (el) {
      if (el !== undefined) {
        if (addToEnd) {
          self.endContent.push(el)
        } else {
          self.content.push(el)
        }
      }
    })
  } else {
    if (addToEnd) {
      this.endContent.push(element)
    } else {
      this.content.push(element)
    }
  }
  return this
}

// adds an element to this element and returns the added element
Element.prototype.append = function (element, addToEnd) {
  if (element === undefined) {
    return this
  }
  if (element && element.then) {
    var self = this
    return elementyPromise(element.then(function (el) {
      return self.append(el, addToEnd)
    }))
  }
  element.parent = this
  if (Array.isArray(element)) {
    var self = this
    element.forEach(function (el) {
      if (el !== undefined) {
        if (addToEnd) {
          self.endContent.push(el)
        } else {
          self.content.push(el)
        }
      }
    })
  } else {
    if (addToEnd) {
      this.endContent.push(element)
    } else {
      this.content.push(element)
    }
  }
  return element
}

// adds text to the content of the element
Element.prototype.text = function (text, dontEscape) {
  if (text !== undefined) {
    this.content.push(dontEscape ? text : escapeHTML(text))
  }
  return this
}

Element.prototype.removeChild = function (element) {
  var index = this.content.indexOf(element)
  if (index > -1) {
    this.content.splice(index, 1)
    delete this.page.elements[element.uid]
  }
  return index > -1
}

// removes the element from its parent
Element.prototype.remove = function () {
  if (this.parent) {
    return this.parent.removeChild(this)
  } else {
    delete this.page.elements[this.uid]
    return true
  }
}

// turns the element into an html string
Element.prototype.stringify = function () {
  var self = this

  var attributes = Object.keys(this.attrs).map(function (k) {
    return k + '="' + self.attrs[k] + '"'
  }).join(' ')

  if (attributes.length > 0) {
    attributes = ' ' + attributes
  }

  var content = this.content.map(function (d) {
    return d.stringify ? d.stringify() : d
  }).join('')

  var endContent = this.endContent.map(function (d) {
    return d.stringify ? d.stringify() : d
  }).join('')

  return '<' + this.type + attributes + '>' + content + endContent + '</' + this.type + '>'
}

function TextElement (page, text, uid) {
  this.page = page
  this.parent = undefined
  this.uid = uid
  this.text = text
}

// turns the element into an html string
TextElement.prototype.stringify = function () {
  return this.text
}

// factory for elements, and a manager for retrieving elements by uid
function Page () {
  this.elements = {}
  this.html = this.create('html', 'html')
  this.head = this.html.append(this.create('head', 'head'))
  this.body = this.html.append(this.create('body', 'body'))
  this.styles = {}
  this.scripts = {}
}

// create an element
Page.prototype.create = function (type, uid) {
  if (uid === undefined) {
    uid = nextId()
  }
  var element = new Element(this, type, uid)
  this.elements[uid] = element
  return element
}

// create an element
Page.prototype.textNode = function (text, uid, dontEscape) {
  if (uid === undefined) {
    uid = nextId()
  }
  var element = new TextElement(this, (dontEscape ? text : escapeHTML(text)), uid)
  this.elements[uid] = element
  return element
}

// get an element by its uid
Page.prototype.get = function (uid) {
  return this.elements[uid]
}

// removes an element using the element itself, or by uid
Page.prototype.remove = function (element) {
  if (!(element instanceof Element)) {
    element = this.get(element)
  }

  if (element.parent !== undefined) {
    element.parent.removeChild(element)
  } else {
    delete this.elements[element.uid]
  }

  return this
}

Page.prototype.stringify = function () {
  return '<!DOCTYPE html>\n' + this.html.stringify()
}

// loads the file specified
function loadAsset (filename) {
  return fs.readFileAsync(filename, 'utf-8')
}

// adds resources to the page from files. if an asset already exists it will not be reloaded
Page.prototype.addAssets = function (obj, options) {
  var promises = []
  var page = this

  if (!options) {
    options = {}
  }

  if (obj.js) {
    Object.keys(obj.js).forEach(function (k) {
      if (!page.scripts[k] || options.override) {
        if (!page.scripts[k]) {
          page.scripts[k] = page.body.append(page.create('script'), true)
        }
        promises.push(loadAsset(obj.js[k])
          .then(function (p) {
            page.scripts[k].remove()
            page.scripts[k] = page.body.append(page.create('script').text(p, true), true)
          }))
      }
    })
  }

  if (obj.css) {
    Object.keys(obj.css).forEach(function (k) {
      if (!page.styles[k] || options.override) {
        if (!page.styles[k]) {
          page.styles[k] = page.head.append(page.create('style'), true)
        }
        promises.push(loadAsset(obj.css[k])
          .then(function (p) {
            page.styles[k].remove()
            page.styles[k] = page.head.append(page.create('style').text(p, true), true)
          }))
      }
    })
  }

  return Promise.all(promises)
    .then(function () {
      return page
    })
}

// utilities / shorthand for certain elements

Page.prototype.script = function (src, uid) {
  return this.create('script', uid)
    .attr('src', src)
}

Page.prototype.stylesheet = function (src, uid) {
  return this.create('link', uid)
    .attr('rel', 'stylesheet')
    .attr('type', 'text/css')
    .attr('href', src)
}

Page.prototype.addCommonMetaTags = function () {
  this.head.append(this.create('meta').attr('charset', 'UTF-8'))
  this.head.append(this.create('meta').attr('name', 'viewport').attr('content', 'width=device-width, initial-scale=1'))
  return this
}

Page.prototype.nextId = function () {
  return nextId()
}

module.exports = function () {
  return new Page()
}
