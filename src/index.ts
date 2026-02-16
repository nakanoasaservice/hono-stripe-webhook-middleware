import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono/types";
import Stripe from "stripe";

/**
 * Variables set by the Stripe webhook middleware, accessible via `c.get("event")`.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { type StripeWebhookVariables } from "hono-stripe-webhook-middleware";
 *
 * const app = new Hono<{ Variables: StripeWebhookVariables }>();
 * ```
 */
export type StripeWebhookVariables = {
	/** The verified Stripe event parsed from the incoming webhook request. */
	event: Stripe.Event;
};

/**
 * Hono middleware that verifies incoming Stripe webhook signatures and
 * makes the parsed event available via `c.get("event")`.
 *
 * @param args - The webhook secret (starting with `whsec_`) and an optional
 *   {@link Stripe.WebhookSignatureVerificationOptions} object, matching the
 *   trailing parameters of `Stripe.webhooks.constructEventAsync`.
 * @returns A Hono middleware handler.
 *
 * @throws {Error} If the webhook secret does not match the expected `whsec_` format.
 * @throws {HTTPException} `400` if the `stripe-signature` header is missing or signature verification fails.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { env } from "cloudflare:workers";
 * import { stripeWebhookMiddleware, type StripeWebhookVariables } from "hono-stripe-webhook-middleware";
 *
 * const app = new Hono<{ Variables: StripeWebhookVariables }>();
 *
 * app.post("/webhook", stripeWebhookMiddleware(env.STRIPE_WEBHOOK_SECRET), (c) => {
 *   const event = c.get("event");
 *   // handle event
 *   return c.json({ received: true });
 * });
 * ```
 */
export function stripeWebhookMiddleware(
	...args: Parameters<typeof Stripe.webhooks.constructEventAsync> extends [
		unknown,
		unknown,
		...infer Rest,
	]
		? Rest
		: never
): MiddlewareHandler {
	if (!/^whsec_[a-zA-Z0-9]+$/.test(args[0])) {
		throw new Error("Invalid webhook secret");
	}

	return async (c, next) => {
		const signature = c.req.header("stripe-signature");
		if (!signature) {
			throw new HTTPException(400, {
				message: "Missing stripe-signature header",
			});
		}

		const body = await c.req.text();

		try {
			const event = await Stripe.webhooks.constructEventAsync(
				body,
				signature,
				...args,
			);

			c.set("event", event);
		} catch (cause) {
			throw new HTTPException(400, {
				message: "Stripe webhook signature verification failed",
				cause,
			});
		}

		await next();
	};
}
