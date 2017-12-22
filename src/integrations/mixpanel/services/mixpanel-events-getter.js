
/* jshint camelcase: false */
const _ = require('lodash');
const moment = require('moment');

function MixpanelEventsGetter(Implementation, params, opts) {
  const MixpanelExport = opts.integrations.mixpanel.mixpanel;
  const panel = new MixpanelExport({
    api_key: opts.integrations.mixpanel.apiKey,
    api_secret: opts.integrations.mixpanel.apiSecret,
  });

  function getPageSize() {
    if (params.page && params.page.size) {
      return parseInt(params.page.size, 10);
    }
    return 5;
  }

  function getPageNumber() {
    if (params.page && params.page.number) {
      return parseInt(params.page.number, 10);
    }
    return 0;
  }

  this.perform = function () {
    const today = moment().format('YYYY-MM-DD');
    const firstDayOfWeek = moment().startOf('week').format('YYYY-MM-DD');

    return panel
      .export({
        from_date: firstDayOfWeek,
        to_date: today,
        where: `properties["id"] == "${params.recordId}"`,
      })
      .then((result) => {
        const count = result.length;
        result = _.reverse(result);
        const resultSelection = _.chunk(result, getPageSize())[getPageNumber()];
        return [count, resultSelection || []];
      });
  };
}

module.exports = MixpanelEventsGetter;
