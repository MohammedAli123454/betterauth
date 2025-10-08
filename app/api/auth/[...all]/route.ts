import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import arcjet, {
  BotOptions,
  detectBot,
  EmailOptions,
  protectSignup,
  shield,
  slidingWindow,
  SlidingWindowRateLimitOptions,
} from '@arcjet/next';
import { findIp } from '@arcjet/ip';

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['userIdOrIp'],
  rules: [shield({ mode: 'LIVE' })],
});

const botSettings = {
  mode: 'LIVE',
  allow: [],
} satisfies BotOptions;

const restrictiveRateLimitSettings = {
  mode: 'LIVE',
  max: 2, // Change to 5 or 10 for easier testing, then change back to 2
  interval: '10m',
} satisfies SlidingWindowRateLimitOptions<[]>;

const laxRateLimitSettings = {
  mode: 'LIVE',
  max: 60,
  interval: '1m',
} satisfies SlidingWindowRateLimitOptions<[]>;

const emailSettings = {
  mode: 'LIVE',
  block: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
} satisfies EmailOptions;

const authHandlers = toNextJsHandler(auth);
export const { GET } = authHandlers;

export async function POST(request: Request) {
  const clonedRequest = request.clone();
  const decision = await checkArcjet(request);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return Response.json(
        { error: 'Rate limit reached. You can only attempt login 2 times per 10 minutes. Please try again later.' },
        { status: 429 }
      );
    } else if (decision.reason.isEmail()) {
      let message: string;

      if (decision.reason.emailTypes.includes('INVALID')) {
        message = 'Email address format is invalid.';
      } else if (decision.reason.emailTypes.includes('DISPOSABLE')) {
        message = 'Disposable email addresses are not allowed.';
      } else if (decision.reason.emailTypes.includes('NO_MX_RECORDS')) {
        message = 'Email domain is not valid.';
      } else {
        message = 'Invalid email.';
      }

      return Response.json({ error: message }, { status: 400 });
    } else {
      return Response.json(
        { error: 'Access forbidden.' },
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
            rateLimit: restrictiveRateLimitSettings,
          })
        )
        .protect(request, { email: body.email, userIdOrIp });
    } else {
      return aj
        .withRule(detectBot(botSettings))
        .withRule(slidingWindow(restrictiveRateLimitSettings))
        .protect(request, { userIdOrIp });
    }
  }

  // Check if this is a sign-in request
  if (request.url.endsWith('/sign-in/email')) {
    return aj
      .withRule(detectBot(botSettings))
      .withRule(slidingWindow(restrictiveRateLimitSettings))
      .protect(request, { userIdOrIp });
  }

  // All other auth requests use lax rate limits
  return aj
    .withRule(detectBot(botSettings))
    .withRule(slidingWindow(laxRateLimitSettings))
    .protect(request, { userIdOrIp });
}
