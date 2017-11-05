import query from 'qs';
import { stripSlashes } from 'feathers-commons';
import { convert } from 'feathers-errors';
const { replace, words, omit } = require('lodash');

function toError (error) {
  throw convert(error);
}

export default class Base {
  constructor (settings) {
    this.name = stripSlashes(settings.name);
    this.options = settings.options;
    this.connection = settings.connection;
    this.base = `${settings.base}/${this.name}`;
  }

  makeUrl (params, id) {
    params = params || {};
    params.query = params.query || {};
    let url = this.base;

    const urlParams = omit(params, ['query', 'headers']);

    if (Object.keys(urlParams).length !== 0) {
      words(url, /:\w+/g).map(item => replace(item, ':', '')).map(item => {
        if (urlParams[item]) url = replace(url, `:${item}`, urlParams[item]);
      });
    }

    if (typeof id !== 'undefined' && id !== null) {
      url += `/${id}`;
    }

    if (Object.keys(params.query).length !== 0) {
      const queryString = query.stringify(params.query);

      url += `?${queryString}`;
    }

    return url;
  }

  find (params = {}) {
    return this.request({
      url: this.makeUrl(params),
      method: 'GET',
      headers: Object.assign({}, params.headers)
    }).catch(toError);
  }

  get (id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'get' can not be undefined`));
    }

    return this.request({
      url: this.makeUrl(params, id),
      method: 'GET',
      headers: Object.assign({}, params.headers)
    }).catch(toError);
  }

  create (body, params = {}) {
    return this.request({
      url: this.makeUrl(params),
      body,
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, params.headers)
    }).catch(toError);
  }

  update (id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'update' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      url: this.makeUrl(params, id),
      body,
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, params.headers)
    }).catch(toError);
  }

  patch (id, body, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'patch' can not be undefined, only 'null' when updating multiple entries`));
    }

    return this.request({
      url: this.makeUrl(params, id),
      body,
      method: 'PATCH',
      headers: Object.assign({ 'Content-Type': 'application/json' }, params.headers)
    }).catch(toError);
  }

  remove (id, params = {}) {
    if (typeof id === 'undefined') {
      return Promise.reject(new Error(`id for 'remove' can not be undefined, only 'null' when removing multiple entries`));
    }

    return this.request({
      url: this.makeUrl(params, id),
      method: 'DELETE',
      headers: Object.assign({}, params.headers)
    }).catch(toError);
  }
}
