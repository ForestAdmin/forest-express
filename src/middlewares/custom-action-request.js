function hasForgedRequesterId(request) {
  return Boolean(request.body.data?.attributes?.requester_id);
}

function unwrapSignedApprovalRequest(actionAuthorizationService, request) {
  const signedApprovalRequest = request.body?.data?.attributes?.signed_approval_request;

  if (signedApprovalRequest) {
    request.body = actionAuthorizationService.verifySignedActionParameters(signedApprovalRequest);
  }
}

async function assertCanTriggerOrApproveCustomAction(
  actionAuthorizationService,
  request,
  canPerformCustomActionParams,
) {
  const requesterId = request.body?.data?.attributes?.requester_id;

  if (requesterId) {
    await actionAuthorizationService.assertCanApproveCustomAction({
      ...canPerformCustomActionParams,
      requesterId,
    });
  } else {
    await actionAuthorizationService.assertCanTriggerCustomAction(canPerformCustomActionParams);
  }
}

module.exports = {
  hasForgedRequesterId,
  unwrapSignedApprovalRequest,
  assertCanTriggerOrApproveCustomAction,
};
