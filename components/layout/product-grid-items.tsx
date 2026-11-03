import Grid from 'components/grid';
import ProductCard from 'components/product-card';
import type { Product } from 'lib/types';

export default function ProductGridItems({ products }: { products: Product[] }) {
  return (
    <>
      {products.map((product) => (
        <Grid.Item key={product.handle} className="animate-fadeIn">
          <ProductCard product={product} />
        </Grid.Item>
      ))}
    </>
  );
}
