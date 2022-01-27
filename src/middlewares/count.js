const deactivateCountMiddleware = (request, response, next) => {
  const { path } = request;
  const splittedPath = path.split('/');

  if (splittedPath[splittedPath.length - 1] === 'count') {
    response.status(200).send({
      meta: {
        count: 'deactivated',
      },
    });
  } else {
    response.status(400).send({
      erorr: 'This middleware can only be used in count routes.',
    });
  }
  next();
};

module.exports = deactivateCountMiddleware;
