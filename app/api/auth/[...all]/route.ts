import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import {
  detectBot,
  protectSignup,
  slidingWindow,
} from '@arcjet/next';
import { findIp } from '@arcjet/ip';
import {
  aj,
  botSettings,
  emailSettings,
  authRateLimitSettings,
  laxRateLimitSettings,
  arcjetErrorMessages,
  getEmailErrorMessage,
} from '@/lib/arcjet-config';

const authHandlers = toNextJsHandler(auth);
export const { GET } = authHandlers;

export async function POST(request: Request) {
  const clonedRequest = request.clone();
  const decision = await checkArcjet(request);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return Response.json(
        { error: arcjetErrorMessages.rateLimit.auth },
        { status: 429 }
      );
    } else if (decision.reason.isEmail()) {
      const message = getEmailErrorMessage(decision.reason.emailTypes);
      return Response.json({ error: message }, { status: 400 });
    } else {
      return Response.json(
        { error: arcjetErrorMessages.general.forbidden },
        { status: 403 }
      );
    }
  }

  return authHandlers.POST(clonedRequest);
}

async function checkArcjet(request: Request) {
  const body = (await request.json()) as unknown;
  const session = await auth.api.getSession({ headers: request.headers });
  const userIdOrIp = (session?.user.id ?? findIp(request)) || '127.0.0.1';

  // Check if this is a sign-up request
  if (request.url.endsWith('/sign-up/email')) {
    if (
      body &&
      typeof body === 'object' &&
      'email' in body &&
      typeof body.email === 'string'
    ) {
      return aj
        .withRule(
          protectSignup({
            email: emailSettings,
            bots: botSettings,
            rateLimit: authRateLimitSettings,
          })
        )
        .protect(request, { email: body.email, userIdOrIp });
    } else {
      return aj
        .withRule(detectBot(botSettings))
        .withRule(slidingWindow(authRateLimitSettings))
        .protect(request, { userIdOrIp });
    }
  }

  // Check if this is a sign-in request
  if (request.url.endsWith('/sign-in/email')) {
    return aj
      .withRule(detectBot(botSettings))
      .withRule(slidingWindow(authRateLimitSettings))
      .protect(request, { userIdOrIp });
  }

  // All other auth requests use lax rate limits
  return aj
    .withRule(detectBot(botSettings))
    .withRule(slidingWindow(laxRateLimitSettings))
    .protect(request, { userIdOrIp });
}
