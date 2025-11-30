import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { headers } from 'next/headers';
import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

const handler = async (req: Request) => {
  const resHeaders = new Headers();

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (opts) =>
      createTRPCContext({
        ...opts,
        resHeaders,
      }),
    onError: ({ error, path }) => {
      console.error(`tRPC Error on '${path ?? '<no-path>'}':`, error);
    },
  });

  // Get headers from Next.js (includes cookies set via cookies())
  const headersList = await headers();
  const setCookieHeaders = headersList.getSetCookie();

  // Merge response headers with Set-Cookie headers from cookies()
  const newHeaders = new Headers(response.headers);

  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      '[tRPC route] set-cookie from resHeaders',
      resHeaders.get('Set-Cookie'),
    );
  }

  resHeaders.forEach((value, key) => {
    newHeaders.append(key, value);
  });

  // Add Set-Cookie headers if they were set via cookies()
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    for (const cookie of setCookieHeaders) {
      newHeaders.append('set-cookie', cookie);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

export { handler as GET, handler as POST };
