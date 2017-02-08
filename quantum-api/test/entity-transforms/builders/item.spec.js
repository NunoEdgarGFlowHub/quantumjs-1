describe('item', () => {
  const quantum = require('quantum-js')
  const dom = require('quantum-dom')
  const header = require('../../../lib/entity-transforms/components/header')
  const collapsible = require('../../../lib/entity-transforms/components/collapsible')
  const item = require('../../../lib/entity-transforms/builders/item')
  const headerBuilders = require('../../../lib/entity-transforms/builders/header')
  const notice = require('../../../lib/entity-transforms/builders/notice')

  it('returns a function', () => {
    item({}).should.be.a('function')
  })

  it('the returned function returns a piece of virtual dom', () => {
    const selection = quantum.select({
      type: 'function',
      params: [],
      content: []
    })

    item({})(selection).should.eql(
      dom.create('div').class('qm-api-item-content')
    )
  })

  it('renders a notice', () => {
    const selection = quantum.select({
      type: 'function',
      params: [],
      content: [
        {type: 'deprecated', params: [], content: ['Warning']}
      ]
    })

    function transformer (selection) {
      return dom.create('div').text(quantum.select.isEntity(selection) ? selection.cs() : selection)
    }

    const deprecatedNoticeBuilder = notice('deprecated', 'Deprecated')

    item({})(selection, transformer).should.eql(
      dom.create('div').class('qm-api-item-content')
        .add(deprecatedNoticeBuilder(selection, transformer))
    )
  })

  it('renders a header', () => {
    const selection = quantum.select({
      type: 'function',
      params: ['Name'],
      content: []
    })

    function transformer (selection) {
      return dom.create('div').text(quantum.select.isEntity(selection) ? selection.cs() : selection)
    }

    const headerBlock = dom.create('div')
      .class('qm-api-item-head')
      .add(header('name', headerBuilders.nameHeaderDetails(selection), selection))
    const contentBlock = dom.create('div')
      .class('qm-api-item-content')

    item({
      header: headerBuilders.nameHeader()
    })(selection, transformer).should.eql(
      collapsible('', headerBlock, contentBlock)
    )
  })

  it('adds the no description class even when tags are present', () => {
    const selection = quantum.select({
      type: 'function',
      params: ['Name'],
      content: [
        {type: 'added', params: [], content: []}
      ]
    })

    function transformer (selection) {
      return dom.create('div').text(quantum.select.isEntity(selection) ? selection.cs() : selection)
    }

    const headerBlock = dom.create('div')
      .class('qm-api-item-head')
      .add(header('name', headerBuilders.nameHeaderDetails(selection), selection))
    const contentBlock = dom.create('div')
      .class('qm-api-item-content')

    item({
      header: headerBuilders.nameHeader()
    })(selection, transformer).should.eql(
      collapsible('', headerBlock, contentBlock)
    )
  })

  it('renders an optional header', () => {
    const selection = quantum.select({
      type: 'function?',
      params: ['Name'],
      content: []
    })

    function transformer (selection) {
      return dom.create('div').text(quantum.select.isEntity(selection) ? selection.cs() : selection)
    }

    const headerBlock = dom.create('div')
      .class('qm-api-item-head qm-api-optional')
      .add(header('name', headerBuilders.nameHeaderDetails(selection), selection))
    const contentBlock = dom.create('div')
      .class('qm-api-item-content')

    const other = item({
      class: 'other',
      header: headerBuilders.typeHeader()
    })

    item({
      header: headerBuilders.nameHeader(),
      renderAsOther: {
        Other: other
      }
    })(selection, transformer).should.eql(
      collapsible('', headerBlock, contentBlock)
    )
  })

  it('renders as another thing', () => {
    const selection = quantum.select({
      type: 'function',
      params: ['Name', 'Other'],
      content: []
    })

    function transformer (selection) {
      return dom.create('div').text(quantum.select.isEntity(selection) ? selection.cs() : selection)
    }

    const headerBlock = dom.create('div')
      .class('qm-api-item-head')
      .add(headerBuilders.typeHeader()(selection, transformer))
    const contentBlock = dom.create('div')
      .class('qm-api-item-content')

    const other = item({
      class: 'other',
      header: headerBuilders.typeHeader()
    })

    item({
      class: 'function',
      header: headerBuilders.nameHeader(),
      renderAsOther: {
        Other: other
      }
    })(selection, transformer).should.eql(
      collapsible('function', headerBlock, contentBlock)
    )
  })
})
