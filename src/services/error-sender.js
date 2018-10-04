function ErrorSender(response,  error) {
  this.sendForbidden = () => {
    const errorObject = this.getErrorObject();
    errorObject.status = 403;

    response
      .status(403)
      .send({
        errors: [errorObject],
      });
  };

  this.getErrorObject = () => {
    if (typeof error === 'string') {
      return {
        title: error,
      };
    }

    return {
      title: error.message,
    };
  };
}

module.exports = ErrorSender;
