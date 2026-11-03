'use client';

import { Dialog, Transition } from '@headlessui/react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Price from 'components/price';
import { DEFAULT_OPTION } from 'lib/constants';
import type { Cart } from 'lib/types';
import { createUrl } from 'lib/utils';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState } from 'react';
import CloseCart from './close-cart';
import { DeleteItemButton } from './delete-item-button';
import { EditItemQuantityButton } from './edit-item-quantity-button';
import OpenCart from './open-cart';

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal({ cart }: { cart: Cart | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (cart?.totalQuantity !== quantityRef.current) {
      if (!isOpen) setIsOpen(true);
      quantityRef.current = cart?.totalQuantity;
    }
  }, [isOpen, cart?.totalQuantity, quantityRef]);

  return (
    <>
      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-[#17211f]/40" aria-hidden="true" />
          </Transition.Child>

          {/* Drawer */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col bg-[#fdf8f2] p-5 shadow-[-8px_0_40px_rgba(23,44,39,0.12)] md:w-[400px]">

              {/* Header */}
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[16px] font-semibold tracking-tight text-[#17211f]">
                  My Cart
                  {cart && cart.totalQuantity > 0 && (
                    <span className="ml-2 rounded-full bg-[#172c27] px-2 py-0.5 text-[11px] font-bold text-white">
                      {cart.totalQuantity}
                    </span>
                  )}
                </p>
                <button aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {/* Empty state */}
              {!cart || cart.lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4">
                  <ShoppingCartIcon className="h-14 text-[#c8b79b]" />
                  <p className="text-[15px] font-semibold text-[#17211f]">Your cart is empty</p>
                  <p className="text-[12px] text-[#68736b]">Add something to get started.</p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden">

                  {/* Line items */}
                  <ul className="flex-1 overflow-y-auto divide-y divide-[#e8d9c4] pr-1">
                    {cart.lines.map((item, i) => {
                      const params = {} as MerchandiseSearchParams;
                      item.merchandise.selectedOptions.forEach(({ name, value }) => {
                        if (value !== DEFAULT_OPTION) params[name.toLowerCase()] = value;
                      });
                      const merchandiseUrl = createUrl(
                        item.merchandise.product.handle,
                        new URLSearchParams(params)
                      );
                      const variant = item.merchandise.product.variants.find(
                        (v) => v.id === item.merchandise.id
                      );
                      const compareAtLineAmount = variant
                        ? (Number(variant.compareAtPrice.amount) * item.quantity).toFixed(2)
                        : undefined;
                      const imgUrl = item.merchandise.product.featuredImage.url;
                      const imgAlt =
                        item.merchandise.product.featuredImage.altText ||
                        item.merchandise.product.title;

                      return (
                        <li key={i} className="py-4">
                          <div className="flex gap-3">
                            {/* Product image */}
                            <Link
                              href={merchandiseUrl}
                              onClick={closeCart}
                              className="relative h-[72px] w-[72px] flex-none overflow-hidden rounded-xl bg-[#ede2d4]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt={imgAlt}
                                className="h-full w-full object-cover"
                                width={72}
                                height={72}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.opacity = '0';
                                }}
                              />
                            </Link>

                            {/* Details */}
                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                              <div className="flex items-start justify-between gap-2">
                                <Link
                                  href={merchandiseUrl}
                                  onClick={closeCart}
                                  className="min-w-0"
                                >
                                  <p className="truncate text-[13px] font-semibold text-[#17211f] hover:text-[#3d6b24]">
                                    {item.merchandise.product.title}
                                  </p>
                                  {item.merchandise.title !== DEFAULT_OPTION && (
                                    <p className="mt-0.5 text-[11px] text-[#68736b]">
                                      {item.merchandise.title}
                                    </p>
                                  )}
                                </Link>
                                <DeleteItemButton item={item} />
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                {/* Qty controls */}
                                <div className="flex h-8 items-center rounded-full border border-[#e0d4c0] bg-white">
                                  <EditItemQuantityButton item={item} type="minus" />
                                  <span className="w-7 text-center text-[12px] font-medium text-[#17211f]">
                                    {item.quantity}
                                  </span>
                                  <EditItemQuantityButton item={item} type="plus" />
                                </div>

                                {/* Price */}
                                <Price
                                  className="flex flex-col items-end text-[13px]"
                                  amount={item.cost.totalAmount.amount}
                                  compareAtAmount={compareAtLineAmount}
                                  currencyCode={item.cost.totalAmount.currencyCode}
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Totals + checkout */}
                  <div className="mt-4 rounded-2xl border border-[#e8d9c4] bg-white p-4">
                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between text-[#68736b]">
                        <span>Taxes</span>
                        <Price
                          amount={cart.cost.totalTaxAmount.amount}
                          currencyCode={cart.cost.totalTaxAmount.currencyCode || 'USD'}
                        />
                      </div>
                      <div className="flex justify-between text-[#68736b]">
                        <span>Shipping</span>
                        <span>Calculated at checkout</span>
                      </div>
                      <div className="flex justify-between border-t border-[#e8d9c4] pt-2 text-[14px] font-semibold text-[#17211f]">
                        <span>Total</span>
                        <Price
                          amount={cart.cost.totalAmount.amount}
                          currencyCode={cart.cost.totalAmount.currencyCode || 'USD'}
                        />
                      </div>
                    </div>

                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="mt-4 block w-full rounded-full bg-[#172c27] py-3.5 text-center text-[13px] font-semibold text-white transition-colors hover:bg-[#27483d]"
                    >
                      Go to checkout
                    </Link>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
