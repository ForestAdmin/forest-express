const deactivateCount = (_, response) => (
  response.status(200).send({
    meta: {
      count: 'deactivated',
    },
  })
);

module.exports = deactivateCount;
