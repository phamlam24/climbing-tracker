export function isAdmin(request: Request): boolean {
  const url = new URL(request.url);
  const token = url.searchParams.get('admin');
  const secret = import.meta.env.ADMIN_TOKEN;

  const isLocalhost =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (isLocalhost) return true;
  if (secret && token === secret) return true;

  return false;
}
