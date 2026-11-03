import { getCart, parseCartLines } from 'lib/store';
import { cookies } from 'next/headers';
import CartModal from './modal';

export default async function Cart() {
  const cart = await getCart(parseCartLines(cookies().get('storeCart')?.value));
  return <CartModal cart={cart} />;
}
