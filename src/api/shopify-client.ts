const DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = process.env.EXPO_PUBLIC_SHOPIFY_API_VERSION;

if (!DOMAIN || !TOKEN) {
  throw new Error("Missing Shopify Storefront credentials in environment variables.");
}

const ENDPOINT = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;

export async function shopifyFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    const message = json.errors.map((e: { message: string }) => e.message).join(", ");
    throw new Error(`Shopify API Error: ${message}`);
  }

  return json.data as T;
}