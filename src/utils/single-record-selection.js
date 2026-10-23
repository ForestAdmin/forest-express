const SINGLE_RECORD_ONLY = 'This action can only be triggered on one record at a time.';

function isSelectionAllowed(action, attributes) {
  if (action.type !== 'single') return true;

  return !attributes?.all_records && attributes?.ids?.length === 1;
}

module.exports = { SINGLE_RECORD_ONLY, isSelectionAllowed };
