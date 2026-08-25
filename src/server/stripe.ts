import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER!,
  GROWTH: process.env.STRIPE_PRICE_GROWTH!,
} as const;
