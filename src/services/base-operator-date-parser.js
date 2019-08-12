import moment from 'moment-timezone';
import { NoMatchingOperatorError } from './error';

const PERIODS = {
  yesterday: 'days',
  previous_week: 'weeks',
  previous_week_to_date: 'weeks',
  previous_month: 'months',
  previous_month_to_date: 'months',
  previous_quarter: 'quarters',
  previous_quarter_to_date: 'quarters',
  previous_year: 'years',
  previous_year_to_date: 'years',
};

const PERIODS_VALUES = {
  days: 'day',
  weeks: 'isoWeek',
  months: 'month',
  quarters: 'quarter',
  years: 'year',
};

const DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL = [
  'today',
  'yesterday',
  'previous_week',
  'previous_month',
  'previous_quarter',
  'previous_year',
  'previous_week_to_date',
  'previous_month_to_date',
  'previous_quarter_to_date',
  'previous_year_to_date',
  'previous_x_days',
  'previous_x_days_to_date',
];

const DATE_OPERATORS = [
  ...DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL,
  'past',
  'future',
  'before_x_hours_ago',
  'after_x_hours_ago',
];

function BaseOperatorDateParser(options) {
  const offsetClient = Number.parseInt(moment().tz(options.timezone).format('Z'), 10);
  const offsetServer = moment().utcOffset() / 60;

  this.offsetHours = offsetServer - offsetClient;

  this.toDateWithTimezone = date => date.add(this.offsetHours, 'h').toDate();

  this.isDateOperator = operator => DATE_OPERATORS.includes(operator);

  this.hasPreviousDateInterval = operator => DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL
    .includes(operator);

  this.getDateFilter = (operator, value) => {
    value = Number.parseInt(value, 10);

    switch (operator) {
      case 'today':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment().startOf('day')),
          [options.operators.LTE]: this.toDateWithTimezone(moment().endOf('day')),
        };
      case 'past':
        return { [options.operators.LTE]: moment().toDate() };
      case 'future':
        return { [options.operators.GTE]: moment().toDate() };
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year': {
        const previousPeriod = moment().subtract(1, PERIODS[operator]);

        return {
          [options.operators.GTE]: this.toDateWithTimezone(previousPeriod.clone()
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [options.operators.LTE]: this.toDateWithTimezone(previousPeriod.clone()
            .endOf(PERIODS_VALUES[PERIODS[operator]])),
        };
      }
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment()
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [options.operators.LTE]: moment().toDate(),
        };
      case 'previous_x_days':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment()
            .subtract(value, 'days').startOf('day')),
          [options.operators.LTE]: this.toDateWithTimezone(moment()
            .subtract(1, 'days').endOf('day')),
        };
      case 'previous_x_days_to_date':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment()
            .subtract(value - 1, 'days').startOf('day')),
          [options.operators.LTE]: moment().toDate(),
        };
      case 'before_x_hours_ago':
        return {
          [options.operators.LTE]: this.toDateWithTimezone(moment().subtract(value, 'hours')),
        };
      case 'after_x_hours_ago':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment().subtract(value, 'hours')),
        };
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.getPreviousDateFilter = (operator, value) => {
    value = Number.parseInt(value, 10);

    switch (operator) {
      case 'today': {
        const yesterday = moment().subtract(1, 'days');

        return {
          [options.operators.GTE]: this.toDateWithTimezone(yesterday.clone().startOf('day')),
          [options.operators.LTE]: this.toDateWithTimezone(yesterday.clone().endOf('day')),
        };
      }
      case 'previous_x_days':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment()
            .subtract(value * 2, 'days').startOf('day')),
          [options.operators.LTE]: this.toDateWithTimezone(moment()
            .subtract(value + 1, 'days').endOf('day')),
        };
      case 'previous_x_days_to_date':
        return {
          [options.operators.GTE]: this.toDateWithTimezone(moment()
            .subtract((value * 2) - 1, 'days').startOf('day')),
          [options.operators.LTE]: this.toDateWithTimezone(moment()
            .subtract(value, 'days')),
        };
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year': {
        const penultimatePeriod = moment().subtract(2, PERIODS[operator]);

        return {
          [options.operators.GTE]: this.toDateWithTimezone(penultimatePeriod.clone()
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [options.operators.LTE]: this.toDateWithTimezone(penultimatePeriod.clone()
            .endOf(PERIODS_VALUES[PERIODS[operator]])),
        };
      }
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date': {
        const previousPeriod = moment().subtract(1, PERIODS[operator]);

        return {
          [options.operators.GTE]: this.toDateWithTimezone(previousPeriod.clone()
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [options.operators.LTE]: this.toDateWithTimezone(previousPeriod.clone()),
        };
      }
      default:
        throw new NoMatchingOperatorError();
    }
  };
}

module.exports = BaseOperatorDateParser;
