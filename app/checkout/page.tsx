import { currentUser } from '@clerk/nextjs/server';
import CashfreePayment from 'components/checkout/cashfree-payment';
import Price from 'components/price';
import { getCart, parseCartLines } from 'lib/store';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Checkout',
  description: 'Review your order before checkout.'
};

export default async function CheckoutPage() {
  const cart = await getCart(parseCartLines(cookies().get('storeCart')?.value));

  // Pre-fill from Clerk if signed in
  const user = await currentUser();
  const prefillEmail = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress ?? '';
  const prefillName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : '';

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <Link
        href="/"
        className="text-[11px] font-medium text-[#627067] transition-colors hover:text-[#172c27]"
      >
        ← Continue shopping
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#637c4d]">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#17211f] sm:text-4xl">
            Your order
          </h1>

          {cart.lines.length ? (
            <>
              <ul className="mt-8 divide-y divide-[#e1e7de] border-y border-[#e1e7de]">
                {cart.lines.map((item) => {
                  const variant = item.merchandise.product.variants.find(
                    (productVariant) => productVariant.id === item.merchandise.id
                  );
                  const compareAtLineAmount = variant
                    ? (Number(variant.compareAtPrice.amount) * item.quantity).toFixed(2)
                    : undefined;
                  return (
                    <li key={item.id} className="flex items-center gap-4 py-4">
                      <div className="relative h-[76px] w-[64px] shrink-0 overflow-hidden rounded-md bg-[#e9ece7]">
                        <Image
                          src={item.merchandise.product.featuredImage.url}
                          alt={item.merchandise.product.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#172c27] px-1 text-[10px] font-medium text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#17211f]">
                          {item.merchandise.product.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#788179]">
                          {item.merchandise.title === 'Default Title'
                            ? 'Everyday essential'
                            : item.merchandise.title}
                        </p>
                      </div>
                      <Price
                        className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[13px]"
                        amount={item.cost.totalAmount.amount}
                        compareAtAmount={compareAtLineAmount}
                        currencyCode={item.cost.totalAmount.currencyCode}
                      />
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 space-y-3 text-[13px] text-[#68736b]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#17211f]">
                    ₹{cart.cost.subtotalAmount.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {Number(cart.cost.subtotalAmount.amount) >= 100 ? 'Free' : 'Calculated next'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#e1e7de] pt-4 text-[15px] font-semibold text-[#17211f]">
                  <span>Total</span>
                  <span>₹{cart.cost.totalAmount.amount}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-xl border border-[#e1e7de] bg-[#fbfcfa] p-8 text-center">
              <p className="text-[14px] font-medium text-[#17211f]">Your cart is empty.</p>
              <p className="mt-2 text-[12px] text-[#68736b]">
                Add something you love and it will show up here.
              </p>
              <Link
                href="/search"
                className="mt-5 inline-flex rounded-full bg-[#172c27] px-5 py-3 text-[11px] font-semibold text-white hover:bg-[#27483d]"
              >
                Browse the collection
              </Link>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-[#e1e7de] bg-[#fbfcfa] p-6 sm:p-7">
          {cart.lines.length ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3e7] text-[#526c3a]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#17211f]">
                Complete your order
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-[#68736b]">
                Enter your details and pay securely via Cashfree.
              </p>
              <div className="mt-6">
                <CashfreePayment
                  cartTotal={cart.cost.totalAmount.amount}
                  currencyCode="INR"
                  prefillEmail={prefillEmail}
                  prefillName={prefillName}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3e7] text-[#526c3a]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
                </svg>
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#17211f]">
                Your cart is empty
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-[#68736b]">
                Add items to your cart before checking out.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
