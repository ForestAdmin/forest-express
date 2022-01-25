const deactivateCountMiddleware = (_, response, next) => {
  response.status(200).send({
    meta: {
      count: 'deactivated',
    },
  });
  next();
};

module.exports = deactivateCountMiddleware;
