var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
var should = chai.should()

var quantum = require('../lib')
var read = quantum.read

describe('read', function () {
  var filename = 'test/files/read/source1.um'

  it('should work', function () {
    var expected = {
      'content': [
        {
          'type': 'test',
          'params': [],
          'content': [
            {
              'type': 'button',
              'params': [],
              'content': ['Hello World']
            }, {
              'type': 'inlinedContent',
              'params': [],
              'content': [
                {
                  'type': 'button',
                  'params': [],
                  'content': ['Hello 2']
                }, {
                  'type': 'last',
                  'params': ['end', 'of', 'the', 'chain'],
                  'content': ['Some content']
                }
              ]
            }, {
              'type': 'altinline',
              'params': ['source2.um'],
              'content': []
            }, {
              'type': 'button',
              'params': [],
              'content': ['Hello World 2']
            }
          ]
        }
      ]
    }

    return read(filename).should.eventually.eql(expected)

  })

  it('different entity tag kind', function () {
    var filename = 'test/files/read/source1.um'

    var expected = {
      'content': [
        {
          'type': 'test',
          'params': [],
          'content': [
            {
              'type': 'button',
              'params': [],
              'content': ['Hello World']
            }, {
              'type': 'inline',
              'params': ['source2.um'],
              'content': []
            }, {
              'type': 'inlinedContent',
              'params': [],
              'content': [
                {
                  'type': 'button',
                  'params': [],
                  'content': ['Hello 2']
                }, {
                  'type': 'inline',
                  'params': ['source3.um'],
                  'content': []
                }
              ]
            }, {
              'type': 'button',
              'params': [],
              'content': ['Hello World 2']
            }
          ]
        }
      ]
    }

    return read(filename, { inlineEntityType: 'altinline' }).should.eventually.eql(expected)

  })

  it('should read non um files as content', function () {
    var filename = 'test/files/read/source4.um'

    var expected = {
      'content': [
        {
          'type': 'test',
          'params': [],
          'content': [
            {
              'type': 'button',
              'params': [],
              'content': ['Hello World']
            }, 'Expect', 'These', 'Lines', '@inline source6.um', {
              'type': 'altinline',
              'params': ['source2.um'],
              'content': []
            }, {
              'type': 'button',
              'params': [],
              'content': ['Hello World 2']
            }
          ]
        }
      ]
    }

    return read(filename).should.eventually.eql(expected)

  })

  it('should be able to read non um files as um files with parse specified as the second parameter', function () {
    var filename = 'test/files/read/source7.um'

    var expected = {
      'content': [
        {
          'type': 'test',
          'params': [],
          'content': [
            {
              'type': 'button',
              'params': [],
              'content': ['Hello World']
            },
            {
              'type': 'inlinedContent',
              'params': [],
              'content': [
                {
                  'type': 'button',
                  'params': [],
                  'content': ['Hello 2']
                }
              ]
            },
            '@inlinedContent',
            '  @button: Hello 2',
            {
              'type': 'button',
              'params': [],
              'content': ['Hello World 2']
            }
          ]
        }
      ]
    }

    return read(filename).should.eventually.eql(expected)

  })

  it('should return an error when a file is not found', function () {
    return read('test/files/read/not-a-source.um').should.be.rejected
  })

  it('should not inline if inline is false', function () {
    var filename = 'test/files/read/source2.um'

    var expected = {
      content: [
        {
          type: 'inlinedContent',
          params: [],
          content: [
            {
              type: 'button',
              params: [],
              content: ['Hello 2']
            },
            {
              type: 'inline',
              params: ['source3.um'],
              content: []
            }
          ]
        }
      ]
    }

    return read(filename, {inline: false}).should.eventually.eql(expected)

  })
})