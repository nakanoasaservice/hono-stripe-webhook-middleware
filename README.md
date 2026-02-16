# hono-stripe-webhook-middleware

[![npm version](https://img.shields.io/npm/v/@nakanoaas/hono-stripe-webhook-middleware)](https://www.npmjs.com/package/@nakanoaas/hono-stripe-webhook-middleware)
[![License](https://img.shields.io/github/license/nakanoasaservice/hono-stripe-webhook-middleware)](https://github.com/nakanoasaservice/hono-stripe-webhook-middleware/blob/main/LICENSE)

A drop-in Hono middleware for verifying Stripe webhook signatures. Built on top of [`Stripe.webhooks.constructEventAsync`](https://github.com/stripe/stripe-node?tab=readme-ov-file#webhook-signing), so it works on **any JavaScript runtime** — Cloudflare Workers, Node.js, Deno, Bun, and more.

## Features

- **Universal** — Powered by `constructEventAsync`, runs on every runtime Hono supports.
- **Tiny** — Zero dependencies beyond `hono` and `stripe` peer deps.
- **Type-safe** — The verified `Stripe.Event` is set on the Hono context and fully typed.
- **Simple API** — One function, one line to set up.

## Installation

```bash
# npm
npm install @nakanoaas/hono-stripe-webhook-middleware

# pnpm
pnpm add @nakanoaas/hono-stripe-webhook-middleware

# yarn
yarn add @nakanoaas/hono-stripe-webhook-middleware
```

> **Peer dependencies:** `hono` >= 4.1.0 and `stripe` >= 15.0.0 must be installed in your project.

## Quick Start

```ts
import { Hono } from "hono";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "@nakanoaas/hono-stripe-webhook-middleware";

const app = new Hono<{ Variables: StripeWebhookVariables }>();

app.post(
  "/webhook",
  stripeWebhookMiddleware("whsec_your_webhook_secret"),
  (c) => {
    const event = c.get("event"); // Stripe.Event — fully typed
    console.log(`Received event: ${event.type}`);
    return c.json({ received: true });
  }
);
```

## Runtime Examples

### Cloudflare Workers

```ts
import { Hono } from "hono";
import { env } from "cloudflare:workers";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "@nakanoaas/hono-stripe-webhook-middleware";

const app = new Hono<{ Variables: StripeWebhookVariables }>();

app.post(
  "/webhook",
  stripeWebhookMiddleware(env.STRIPE_WEBHOOK_SECRET),
  (c) => {
    const event = c.get("event");
    return c.json({ received: true });
  }
);

export default app;
```

### Node.js

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "@nakanoaas/hono-stripe-webhook-middleware";

const app = new Hono<{ Variables: StripeWebhookVariables }>();

app.post(
  "/webhook",
  stripeWebhookMiddleware(process.env.STRIPE_WEBHOOK_SECRET!),
  (c) => {
    const event = c.get("event");
    return c.json({ received: true });
  }
);

serve(app);
```

### Deno

```ts
import { Hono } from "npm:hono";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "npm:@nakanoaas/hono-stripe-webhook-middleware";

const app = new Hono<{ Variables: StripeWebhookVariables }>();

app.post(
  "/webhook",
  stripeWebhookMiddleware(Deno.env.get("STRIPE_WEBHOOK_SECRET")!),
  (c) => {
    const event = c.get("event");
    return c.json({ received: true });
  }
);

Deno.serve(app.fetch);
```

### Bun

```ts
import { Hono } from "hono";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "@nakanoaas/hono-stripe-webhook-middleware";

const app = new Hono<{ Variables: StripeWebhookVariables }>();

app.post(
  "/webhook",
  stripeWebhookMiddleware(Bun.env.STRIPE_WEBHOOK_SECRET!),
  (c) => {
    const event = c.get("event");
    return c.json({ received: true });
  }
);

export default app;
```

## Dynamic Configuration

If the webhook secret is not available at module scope (e.g. it lives in the request-scoped `c.env`), you can apply the middleware dynamically — just like Hono's built-in JWT middleware:

```ts
import { Hono } from "hono";
import {
  stripeWebhookMiddleware,
  type StripeWebhookVariables,
} from "@nakanoaas/hono-stripe-webhook-middleware";

type Env = {
  Bindings: { STRIPE_WEBHOOK_SECRET: string };
  Variables: StripeWebhookVariables;
};

const app = new Hono<Env>();

app.use("/webhook/*", (c, next) => {
  const middleware = stripeWebhookMiddleware(c.env.STRIPE_WEBHOOK_SECRET);
  return middleware(c, next);
});

app.post("/webhook", (c) => {
  const event = c.get("event");
  return c.json({ received: true });
});
```

## Debugging

When signature verification fails, the middleware throws an `HTTPException` with a `400` status. The original error from Stripe is attached as `cause`, so you can inspect it in your error handler:

```ts
import { HTTPException } from "hono/http-exception";

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error.cause);
    return error.getResponse();
  }
  // ...
});
```

## API

### `stripeWebhookMiddleware(...args)`

Creates a Hono middleware handler that verifies Stripe webhook signatures.

The arguments are forwarded to the 3rd parameter onwards of [`Stripe.webhooks.constructEventAsync`](https://github.com/stripe/stripe-node?tab=readme-ov-file#webhook-signing) (i.e. everything after `payload` and `header`, which the middleware supplies automatically).

On success, the verified `Stripe.Event` is set on the context and can be retrieved via `c.get("event")`.

### `StripeWebhookVariables`

TypeScript type for the Hono context variables. Pass it as a generic to `Hono` to get full type inference on `c.get("event")`.

```ts
const app = new Hono<{ Variables: StripeWebhookVariables }>();
```

## Looking for a Lighter Alternative?

If you don't need the full Stripe SDK and want a smaller bundle, check out [hono-stripe-webhook-middleware-lite](https://github.com/nakanoasaservice/hono-stripe-webhook-middleware-lite) — a sister library that handles webhook signature verification without depending on `stripe`.

## License

Apache-2.0
