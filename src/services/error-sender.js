function ErrorSender(response,  error) {
  this.sendForbidden = () => {
    response
      .status(403)
      .send({
        errors: [{
          status: 403,
          title: error,
        }],
      });
  };
}

module.exports = ErrorSender;
