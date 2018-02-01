const chai = require('chai');
const chaiSubset = require('chai-subset');
const ApimapSorter = require('../../services/apimap-sorter')

const { expect } = chai;
chai.use(chaiSubset);

describe('Service > Apimap Sorter', () => {
  const apimap = {
    data: [{
      id: 'users',
      type: 'collections',
      attributes: {
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'name', type: 'String' },
          { field: 'firstName', type: 'String' },
          { field: 'lastName', type: 'String' },
          { field: 'email', type: 'String' },
          { field: 'url', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'users',
      },
    }, {
      id: 'guests',
      type: 'collections',
      attributes: {
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'email', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'guests',
      },
    }, {
      id: 'animals',
      type: 'collections',
      attributes: {
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'animals',
      },
    }],
    "included":[
      {
        "id":"users.import",
        "type":"actions",
        "links":{
          "self":"/actions"
        },
        "attributes":{
          "name":"import",
          "fields":[
            {
              "type":"File",
              "field":"File"
            }
          ],
          "global":null,
          "download":null,
          "endpoint":null,
          "redirect":null,
          "http-method":null
        }
      },
      {
        "id":"animals.ban",
        "type":"actions",
        "links":{
          "self":"/actions"
        },
        "attributes":{
          "name":"import",
          "fields":[
            {
              "type":"File",
              "field":"File"
            }
          ],
          "global":null,
          "download":null,
          "endpoint":null,
          "redirect":null,
          "http-method":null
        }
      }
    ],
    meta: {
      liana_version: '1.5.24',
      liana: 'forest-rails',
    },
  };

  const sortedApimap = new ApimapSorter(apimap);

  it('should sort the data section', () => {
    expect(sortedApimap.data.map(a => a.id))
      .to.include.ordered.members(['animals', 'guests', 'users']);
  })

  it('should sort the data attributes', () => {
    expect(Object.keys(sortedApimap.data[0].attributes))
      .to.include.ordered.members(['fields', 'name']);
    expect(Object.keys(sortedApimap.data[1].attributes))
      .to.include.ordered.members(['fields', 'name']);
    expect(Object.keys(sortedApimap.data[2].attributes))
      .to.include.ordered.members(['fields', 'name']);
  })

  it('should sort the data fields', () => {
    expect(sortedApimap.data[0].attributes.fields.map(f => f.field))
      .to.include.ordered.members(['createdAt', 'id', 'updatedAt']);
    expect(sortedApimap.data[1].attributes.fields.map(f => f.field))
      .to.include.ordered.members(['createdAt', 'email', 'id', 'updatedAt']);
    expect(sortedApimap.data[2].attributes.fields.map(f => f.field))
      .to.include.ordered.members([
        'createdAt', 'email', 'firstName',
        'id', 'lastName', 'name', 'updatedAt', 'url'
      ]);
  })

  it('should sort the included section', () => {
    expect(sortedApimap.included.map(i => i.id))
      .to.include.ordered.members(['animals.ban', 'users.import']);
  })

  it('should sort the meta section', () => {
    expect(Object.keys(sortedApimap.meta))
      .to.include.ordered.members(['liana', 'liana_version']);
  })
})
