export function deploymentOrigin(value) {
  if (!value)
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL to the intended public HTTPS origin before deploying.",
    );
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be a valid public HTTPS origin.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be a public HTTPS origin without a path, query, or credentials.",
    );
  return url.origin;
}
export function requireDeploymentDatabase(configText) {
  const match = configText.match(/"database_id"\s*:\s*"([^"]+)"/);
  if (
    !match ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(match[1]) ||
    match[1] === "00000000-0000-0000-0000-000000000000"
  )
    throw new Error(
      "Configure the production D1 database before deploying; the local placeholder cannot be published.",
    );
}
