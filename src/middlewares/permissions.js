function createCheckListPermission(environmentSecret) {
  return function checkListPermission(request, response, next) {


    return next();
  };
}

module.exports = createIpAuthorizer;
