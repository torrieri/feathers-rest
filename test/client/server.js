import feathers from 'feathers';
import bodyParser from 'body-parser';
import memory from 'feathers-memory';
import errors from 'feathers-errors';
import rest from '../../src';

// eslint-disable-next-line no-extend-native
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {};

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key];
    }, this);

    return alt;
  },
  configurable: true,
  writable: true
});

let errorHandler = function (error, req, res, next) {
  const code = !isNaN(parseInt(error.code, 10)) ? parseInt(error.code, 10) : 500;
  res.status(code);

  res.format({
    'application/json': function () {
      let output = Object.assign({}, error.toJSON());
      res.json(output);
    }
  });
};

module.exports = function (configurer) {
  // Create an in-memory CRUD service for our Todos
  var todoService = memory().extend({
    get (id, params) {
      if (params.query.error) {
        throw new Error('Something went wrong');
      }

      if (params.query.feathersError) {
        throw new errors.NotAcceptable('This is a Feathers error', { data: true });
      }

      return this._super(id, params)
        .then(data => Object.assign({ query: params.query }, data));
    },

    remove (id, params) {
      if (id === null) {
        return Promise.resolve({
          id, text: 'deleted many'
        });
      }

      if (params.query.noContent) {
        return Promise.resolve();
      }

      return this._super.apply(this, arguments);
    }
  });

  var app = feathers()
    .configure(rest(function formatter (req, res, next) {
      if (!res.data) {
        next();
      }

      res.format({
        html () {
          res.end('<h1>This is HTML content. You should not see it.</h1>');
        },

        json () {
          res.json(res.data);
        }
      });
    }))
    // Parse HTTP bodies
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    // Host the current directory (for index.html)
    .use(feathers.static(__dirname))
    // Host our Todos service on the /todos path
    .use('/todos', todoService)
    .use(errorHandler);

  if (typeof configurer === 'function') {
    configurer.call(app);
  }

  app.service('todos').create({ text: 'some todo', complete: false }, {}, function () {});

  return app;
};
