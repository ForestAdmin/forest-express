const deactivateCountMiddleware = (request, response) => {
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
      error: 'The deactiveCount middleware can only be used in count routes.',
    });
  }
};

module.exports = deactivateCountMiddleware;
