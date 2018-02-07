'use strict';
/* global describe, it */
var chai = require('chai');
var chaiSubset = require('chai-subset');
var ApimapSorter = require('../../services/apimap-sorter');

var expect = chai.expect;
chai.use(chaiSubset);

describe('Service > Apimap Sorter', function () {
  var apimap = {
    meta: {
      'orm_version': '4.34.9',
      'liana_version': '1.5.24',
      'database_type': 'postgresql',
      liana: 'forest-rails',
    },
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
      type: 'collections',
      id: 'animals',
      attributes: {
        fields: [
          { 'is-filterable': false, field: 'id', 'is-sortable': false, type: 'Number' },
          { type: 'Date', field: 'createdAt' },
          { field: 'updatedAt', type: 'Date' },
        ],
        name: 'animals',
        integration: 'close.io',
        'is-virtual': true,
      },
    }],
    included:[{
      id: 'users.Women',
      type: 'segments',
      attributes: {
        name: 'Women'
      }
    }, {
      id: 'users.import',
      type: 'actions',
      links: {
        self: '/actions'
      },
      attributes: {
        name: 'import',
        fields: [
          {
            isRequired: true,
            type: 'Boolean',
            field: 'Save',
            description: 'save the import file if true.',
            defaultValue: 'true'
          },
          {
            type: 'File',
            field: 'File'
          }
        ],
        'http-method': null
      }
    }, {
      attributes: {
        name: 'Men'
      },
      id: 'users.Men',
      type: 'segments'
    }, {
      id: 'animals.ban',
      type: 'actions',
      links: {
        self: '/actions'
      },
      attributes: {
        name: 'import',
        global: true,
        download: null,
        endpoint: null,
        redirect: null,
        'http-method': null
      }
    }],
  };

  var apimapSorted = new ApimapSorter(apimap);

  it('should sort the apimap sections', function () {
    expect(Object.keys(apimapSorted))
      .to.include.ordered.members(['data', 'included', 'meta']);
  });

  it('should sort the data collections', function () {
    expect(apimapSorted.data.map(function(collection) { return collection.id; }))
      .to.include.ordered.members(['animals', 'guests', 'users']);
  });

  it('should sort the data collection values', function () {
    expect(Object.keys(apimapSorted.data[0]))
      .to.include.ordered.members(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.data[1]))
      .to.include.ordered.members(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.data[2]))
      .to.include.ordered.members(['type', 'id', 'attributes']);
  });

  it('should sort the data collections attributes values', function () {
    expect(Object.keys(apimapSorted.data[0].attributes))
      .to.include.ordered.members(['name', 'integration', 'is-virtual', 'fields']);
    expect(Object.keys(apimapSorted.data[1].attributes))
      .to.include.ordered.members(['name', 'fields']);
    expect(Object.keys(apimapSorted.data[2].attributes))
      .to.include.ordered.members(['name', 'fields']);
  });

  it('should sort the data collections attributes fields by name', function () {
    expect(apimapSorted.data[0].attributes.fields.map(function(field) { return field.field; }))
      .to.include.ordered.members(['createdAt', 'id', 'updatedAt']);
    expect(apimapSorted.data[1].attributes.fields.map(function(field) { return field.field; }))
      .to.include.ordered.members(['createdAt', 'email', 'id', 'updatedAt']);
    expect(apimapSorted.data[2].attributes.fields.map(function(field) { return field.field; }))
      .to.include.ordered.members(['createdAt', 'email', 'firstName',
        'id', 'lastName', 'name', 'updatedAt', 'url']);
  });

  it('should sort the data collections attributes fields values', function () {
    expect(Object.keys(apimapSorted.data[0].attributes.fields[1]))
      .to.include.ordered.members(['field', 'type', 'is-filterable', 'is-sortable']);
  });

  it('should sort the included actions and segments objects', function () {
    expect(apimapSorted.included.map(function(object) { return object.id; }))
      .to.include.ordered.members(['animals.ban', 'users.import', 'users.Men', 'users.Women']);
  });

  it('should sort the included actions and segments objects values', function () {
    expect(Object.keys(apimapSorted.included[0]))
      .to.include.ordered.members(['type', 'id', 'attributes', 'link']);
    expect(Object.keys(apimapSorted.included[1]))
      .to.include.ordered.members(['type', 'id', 'attributes', 'link']);
    expect(Object.keys(apimapSorted.included[2]))
      .to.include.ordered.members(['type', 'id', 'attributes']);
    expect(Object.keys(apimapSorted.included[3]))
      .to.include.ordered.members(['type', 'id', 'attributes']);
  });

  it('should sort the included actions and segments objects attributes values', function () {
    expect(Object.keys(apimapSorted.included[0].attributes))
      .to.include.ordered.members(['name', 'download', 'endpoint', 'global', 'http-method', 'redirect']);
    expect(Object.keys(apimapSorted.included[1].attributes))
      .to.include.ordered.members(['name', 'http-method', 'fields']);
    expect(Object.keys(apimapSorted.included[2].attributes))
      .to.include.ordered.members(['name']);
    expect(Object.keys(apimapSorted.included[3].attributes))
      .to.include.ordered.members(['name']);
  });

  it('should sort the included action attributes fields by name', function () {
    expect(apimapSorted.included[1].attributes.fields.map(function(field) { return field.field; }))
      .to.include.ordered.members(['File', 'Save']);
  });

  it('should sort the included action fields values', function () {
    expect(Object.keys(apimapSorted.included[1].attributes.fields[0]))
      .to.include.ordered.members(['field', 'type', 'defaultValue', 'description', 'isRequired']);
  });

  it('should sort the meta values', function () {
    expect(Object.keys(apimapSorted.meta))
      .to.include.ordered.members(['database_type', 'liana', 'liana_version', 'orm_version']);
  });
});
