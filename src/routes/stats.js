
const auth = require('../services/auth');
const path = require('../services/path');
const StatSerializer = require('../serializers/stat');

module.exports = function (app, model, Implementation, opts) {
  const modelName = Implementation.getModelName(model);

  this.create = function (req, res, next) {
    let promise = null;

    switch (req.body.type) {
      case 'Value':
        promise = new Implementation.ValueStatGetter(model, req.body, opts)
          .perform();
        break;
      case 'Pie':
        promise = new Implementation.PieStatGetter(model, req.body, opts)
          .perform();
        break;
      case 'Line':
        promise = new Implementation.LineStatGetter(model, req.body, opts)
          .perform();
        break;
    }

    if (!promise) {
      return res.status(400).send({ error: 'Chart type not found.' });
    }

    promise
      .then(stat => new StatSerializer(stat).perform())
      .then((stat) => {
        res.send(stat);
      })
      .catch(next);
  };

  this.perform = function () {
    app.post(
      path.generate(`stats/${modelName}`, opts), auth.ensureAuthenticated,
      this.create,
    );
  };
};
