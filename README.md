# Independent Storefront

A Next.js storefront starter with a sample catalog and a cookie-backed demo cart. It does not connect to BigCommerce or any other commerce API.

## Run locally

Requirements: Node.js 18 or newer and pnpm.

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Set up Clerk authentication

1. Create a Clerk application in the [Clerk Dashboard](https://dashboard.clerk.com), and enable the sign-in methods you want to offer.
2. Copy the application's publishable key and secret key into `.env.local` as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Set `ADMIN_EMAILS` to a comma-separated list of the email addresses that should access `/admin`. These addresses must match the primary email addresses of the corresponding Clerk users.
4. Restart the development server after changing environment variables. The storefront has sign-in and sign-up controls, and the `/sign-in` and `/sign-up` routes use Clerk's hosted components.

The redirect URL settings in `.env.example` send users back to `/` after signing in or signing up. Clerk's middleware is installed, and admin pages and API routes check the authenticated user's email on the server. Admin access is controlled entirely through Clerk: sign in with an email listed in `ADMIN_EMAILS` to access the inventory and product editors. Keep `CLERK_SECRET_KEY` server-only and configure all required Clerk variables, including `ADMIN_EMAILS`, in your production environment as well.

## Store product images in Backblaze B2

Product images upload directly from the browser to a public Backblaze B2 bucket using short-lived, server-signed S3-compatible URLs. The application server never proxies the image bytes. Before upload, the browser resizes each image to at most 2400 px and converts it to WebP (quality 82); source files are limited to 20 MB, optimized files to 8 MB, and each product to 10 images. Supabase stores the image URL, object key, dimensions, and alt text. Use the B2 public download URL now; `B2_PUBLIC_BASE_URL` can later be changed to a CDN/custom-domain base without changing the stored object keys.

1. Create a **public** B2 bucket. Use the region and S3 endpoint shown for that bucket. Create an application key restricted to this bucket with file read, write, and delete capabilities. Keep its key ID and application key server-side.
2. Configure the bucket's CORS rules to allow `PUT` from your local storefront origin (for example, `http://localhost:3000`) and each production storefront origin. Permit the `Content-Type` and `Cache-Control` request headers. A CORS rejection appears in the image editor; CORS only enables browser uploads and does not make the secret application key public.
3. Copy `.env.example` to `.env.local` if needed and set `B2_ENDPOINT` (for example, `https://s3.us-west-004.backblazeb2.com`), `B2_REGION` (for example, `us-west-004`), `B2_BUCKET`, `B2_KEY_ID`, and `B2_APPLICATION_KEY`. Set `B2_PUBLIC_BASE_URL` to the bucket's public download base, including its bucket path (for example, `https://f004.backblazeb2.com/file/your-bucket-name`). Never prefix the B2 key or application key with `NEXT_PUBLIC_`.
4. Run the migrations in timestamp order in the Supabase SQL Editor: [`20261012000000_store_product_overrides.sql`](./supabase/migrations/20261012000000_store_product_overrides.sql), [`20261013000000_add_compare_at_price.sql`](./supabase/migrations/20261013000000_add_compare_at_price.sql), [`20261014000000_homepage_promo.sql`](./supabase/migrations/20261014000000_homepage_promo.sql), [`20261015000000_expand_homepage_promotions.sql`](./supabase/migrations/20261015000000_expand_homepage_promotions.sql), [`20261016000000_product_images.sql`](./supabase/migrations/20261016000000_product_images.sql), and [`20261017000000_store_orders.sql`](./supabase/migrations/20261017000000_store_orders.sql). Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; product image metadata is stored in Supabase, but image bytes remain in B2.
5. Restart the app, sign in with an address in `ADMIN_EMAILS`, and use **Add images** in a product editor. Save the product to publish the new gallery. For production, set all B2 and Supabase variables in your hosting provider and restart/redeploy after changing them.

Object keys are unique and immutable, and uploads are cached for one year. New uploads use a `staging/` prefix and are copied to permanent product keys only when the Supabase save succeeds; B2 lifecycle rules should expire abandoned `staging/` objects after a short window (for example, one day). Removing a saved image deletes its B2 object after the Supabase update succeeds. If bucket file versioning is enabled, configure lifecycle rules to hide old versions and delete hidden versions after the rollback window you want; otherwise deleted/replaced image versions may continue consuming storage. The admin's homepage promotion fields still accept public HTTPS image URLs; product image uploads are managed through the product editor.

## Customize the storefront

- Replace the example products, collections, and pages in [`lib/store.ts`](./lib/store.ts). Product type, material, color, size, price, and availability power the catalog filters and product selectors. Stock and variant combinations start as demo data; admin changes override them in Supabase when configured.
- Product recommendation sections are curated sample groupings, not recommendations derived from customer purchase history.
- The footer includes a newsletter signup design, but subscriptions are not collected until an email marketing service is connected.
- Sample Privacy, Terms, Shipping, Returns, and Disclaimer pages are linked in the footer. They contain prompts for business-specific details and are starting-point templates, not legal advice; complete and review them for your business and applicable law before launch.
- `/admin` links to the restricted `/admin/inventory` workspace. Access is controlled through Clerk: only authenticated users with an email in `ADMIN_EMAILS` can view and edit. Product edits are saved to Supabase. To enable persistent edits, apply the catalog migrations described above and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (and in Vercel environment variables for deployment). The service-role key must remain server-only.
- Orders placed through the Cashfree checkout are saved to the `store_orders` table. The `/admin/orders` page shows all orders with payment status, customer details, and purchased items. Run the `store_orders` migration to enable order tracking.
- Original/compare-at price is stored separately from the selling price. Run [`supabase/migrations/20261013000000_add_compare_at_price.sql`](./supabase/migrations/20261013000000_add_compare_at_price.sql) after the initial overrides migration to enable saving it. Sample catalog discount prices are generated demo values; replace them with accurate prices before launch. The cart and checkout totals always use the selling price.
- Saved catalog changes invalidate storefront routes so updated prices and variant stock are reflected across product cards, details, search, and cart. Cart quantities are capped to current variant stock, and quick-add selects an available variant.
- Edit all three homepage animated offer cards and the scrolling deals banner at the top of `/admin/inventory`. Each card has editable imagery, copy, discount percentage, button label, and same-site destination; the banner has editable background, marquee text, supporting copy, and button. Images use public HTTPS URLs. Apply the homepage migrations described above after the catalog migrations.
- Change the site name and optional canonical URL in `.env.local`. See `.env.example`.
- Replace the sample product image URLs with your own images before launch.
- Update the page metadata, policies, contact information, and styling for your business.

The cart is a lightweight demo stored in an HTTP-only cookie. Add-to-cart, buy-now, and the checkout order summary are available, but checkout does not yet process payments or place orders. Connect your own database, payment provider, and order workflow before accepting orders.

## Deployment

To deploy, push this project to your own GitHub repository, import that repository into Vercel, and deploy it as a standard Next.js app. Configure `SITE_NAME` and `NEXT_PUBLIC_SITE_URL` in Vercel if needed. The deployment does not require any BigCommerce environment variables.
