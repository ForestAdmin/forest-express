// NOTICE: The `fields[collection]` query parameter is documented as a comma-separated
//         string (e.g. `fields[book]=id,title`). Some clients (such as collections with
//         a composite primary key requested through the workflow executor) serialize it
//         as `fields[collection][]=a&fields[collection][]=b`, which the query parser turns
//         into an array. Downstream consumers — both forest-express serializers and the
//         ORM adapters (forest-express-sequelize / -mongoose) which read the same
//         `request.query` reference — expect a string and call `.split(',')` on it,
//         crashing on arrays. We normalize arrays back to the documented comma-separated
//         form once, at the HTTP boundary, so every consumer receives the expected shape.
function normalizeQueryFields(request, response, next) {
  const fields = request.query && request.query.fields;

  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    Object.keys(fields).forEach((collection) => {
      const value = fields[collection];
      if (Array.isArray(value)) {
        fields[collection] = value.join(',');
      }
    });
  }

  next();
}

module.exports = normalizeQueryFields;
