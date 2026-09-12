// Dummy values so modules that construct SDK clients at import time
// (Anthropic, Stripe, Firecrawl, Prisma's pg adapter) don't throw when
// imported in tests that never actually call out to those services.
process.env.ANTHROPIC_API_KEY ??= "sk-ant-test-dummy";
process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
process.env.FIRECRAWL_API_KEY ??= "fc-test-dummy";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
