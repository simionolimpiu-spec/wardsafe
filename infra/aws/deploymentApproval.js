export function readDeploymentApproval(env = process.env) {
  const rawValue = env.SAFEFLOW_DEPLOYMENT_APPROVED;
  const approved = rawValue === 'true';
  const observedValue = typeof rawValue === 'string' ? `"${rawValue}"` : 'unset';

  return Object.freeze({
    approved,
    rawValue,
    message: approved
      ? 'SAFEFLOW_DEPLOYMENT_APPROVED=true; deployment approved.'
      : `SAFEFLOW_DEPLOYMENT_APPROVED is ${observedValue}; deployment is not approved. Set it to the exact string "true" before deploy.`
  });
}
