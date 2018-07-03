const _ = require('lodash');
const moment = require('moment');

function MixpanelEventsGetter(Implementation, params, opts) {
  var MixpanelExport = opts.integrations.mixpanel.mixpanel;
  var panel = new MixpanelExport({
    'api_key': opts.integrations.mixpanel.apiKey,
    'api_secret': opts.integrations.mixpanel.apiSecret
  });

  function getPageSize() {
    if (params.page && params.page.size) {
      return parseInt(params.page.size, 10);
    } else {
      return 5;
    }
  }

  function getPageNumber() {
    if (params.page && params.page.number) {
      return parseInt(params.page.number, 10);
    } else {
      return 0;
    }
  }

  this.perform = function () {
    var today = moment().format('YYYY-MM-DD');
    var firstDayOfWeek = moment().startOf('week').format('YYYY-MM-DD');

    return panel
      .export({
        from_date: firstDayOfWeek,
        to_date: today,
        where: 'properties["id"] == "' + params.recordId + '"'
      })
      .then(function (result) {
        var count = result.length;
        result = _.reverse(result);
        var resultSelection = _.chunk(result, getPageSize())[getPageNumber()];
        return [count, resultSelection || []];
      });
  };
}

module.exports = MixpanelEventsGetter;
