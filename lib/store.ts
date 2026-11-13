import { getCatalogProducts, getManagedCollections } from 'lib/catalog-storage';
import { defaultSort, type SortKey } from 'lib/constants';
import type {
    Cart,
    CartLine,
    Collection,
    MenuItem,
    Product,
    ProductVariant,
    StorePage
} from 'lib/types';

const updatedAt = '2026-10-12T00:00:00.000Z';
const currencyCode = 'INR';

const productColors: Record<string, string[]> = {
  Jackets: ['Olive', 'Black', 'Sand'],
  'Tote bags': ['Natural', 'Black'],
  Sweaters: ['Cream', 'Charcoal', 'Forest'],
  Sneakers: ['White', 'Black', 'Olive'],
  Caps: ['Olive', 'Navy', 'Black'],
  Shirts: ['White', 'Blue', 'Natural'],
  'T-shirts': ['White', 'Black', 'Sage'],
  Jeans: ['Blue', 'Black'],
  'Crossbody bags': ['Black', 'Tan'],
  'Travel bags': ['Olive', 'Natural'],
  'Slip-on shoes': ['Natural', 'Navy'],
  Loafers: ['Brown', 'Black'],
  'Bucket hats': ['Sand', 'Olive', 'Black'],
  Beanies: ['Charcoal', 'Cream', 'Rust'],
  Sunglasses: ['Black', 'Tortoise'],
  'Card holders': ['Tan', 'Black']
};

const productSizes: Record<string, string[]> = {
  Jackets: ['XS', 'S', 'M', 'L', 'XL'],
  Sweaters: ['XS', 'S', 'M', 'L', 'XL'],
  Shirts: ['XS', 'S', 'M', 'L', 'XL'],
  'T-shirts': ['XS', 'S', 'M', 'L', 'XL'],
  Jeans: ['28', '30', '32', '34', '36'],
  Sneakers: ['7', '8', '9', '10', '11'],
  'Slip-on shoes': ['7', '8', '9', '10', '11'],
  Loafers: ['7', '8', '9', '10', '11']
};

const makeProduct = ({
  id,
  handle,
  title,
  description,
  amount,
  image,
  collections,
  productType,
  material,
  gallery
}: {
  id: string;
  handle: string;
  title: string;
  description: string;
  amount: string;
  image: string;
  collections: string[];
  productType: string;
  material: string;
  gallery?: string[];
}): Product => {
  const colors = productColors[productType] || ['Natural', 'Black'];
  const sizes = productSizes[productType] || ['One size'];
  const featuredImage = {
    url: image,
    altText: title,
    width: 1200,
    height: 1200
  };
  const images = [
    featuredImage,
    ...(gallery || []).map((url, index) => ({
      url,
      altText: `${title} view ${index + 2}`,
      width: 1200,
      height: 1200
    }))
  ];
  const price = { amount, currencyCode };
  const compareAtPrice = {
    amount: (Math.ceil(Number(amount) * 1.25 * 100) / 100).toFixed(2),
    currencyCode
  };
  const variants: ProductVariant[] = colors.flatMap((color, colorIndex) =>
    sizes.map((size, sizeIndex) => {
      const inventoryQuantity = 8 + ((colorIndex + sizeIndex) % 13);

      return {
        parentId: id,
        id: `${id}-${color}-${size}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: `${color} / ${size}`,
        availableForSale: inventoryQuantity > 0,
        inventoryQuantity,
        selectedOptions: [
          { name: 'Color', value: color },
          { name: 'Size', value: size }
        ],
        price,
        compareAtPrice
      };
    })
  );
  const options = [
    { id: `${id}-color`, name: 'Color', values: colors },
    { id: `${id}-size`, name: 'Size', values: sizes }
  ];

  return {
    id,
    handle: `/product/${handle}`,
    availableForSale: true,
    title,
    description,
    descriptionHtml: `<p>${description}</p>`,
    options,
    priceRange: {
      maxVariantPrice: price,
      minVariantPrice: price,
      maxCompareAtPrice: compareAtPrice,
      minCompareAtPrice: compareAtPrice
    },
    variants,
    featuredImage,
    images,
    seo: { title, description },
    tags: [],
    updatedAt,
    collectionHandles: collections,
    productType,
    material,
    colors,
    sizes
  };
};

export const products: Product[] = [
  makeProduct({
    id: 'field-jacket',
    handle: 'field-jacket',
    title: 'The Field Jacket',
    description: 'A durable everyday layer, cut from soft, structured cotton.',
    amount: '148.00',
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85&sat=-25'
    ],
    productType: 'Jackets',
    material: 'Cotton',
    collections: ['clothing', 'featured']
  }),
  makeProduct({
    id: 'everyday-tote',
    handle: 'everyday-tote',
    title: 'Everyday Tote',
    description: 'A roomy canvas carryall made for market mornings and daily errands.',
    amount: '42.00',
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85&sat=-20'
    ],
    productType: 'Tote bags',
    material: 'Canvas',
    collections: ['accessories', 'bags', 'featured']
  }),
  makeProduct({
    id: 'weekend-knit',
    handle: 'weekend-knit',
    title: 'Weekend Knit',
    description: 'An easy, textured knit designed to be reached for season after season.',
    amount: '96.00',
    image:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=85',
    productType: 'Sweaters',
    material: 'Wool blend',
    collections: ['clothing', 'featured']
  }),
  makeProduct({
    id: 'studio-sneaker',
    handle: 'studio-sneaker',
    title: 'Studio Sneaker',
    description: 'A clean low-profile sneaker with a cushioned, all-day sole.',
    amount: '110.00',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85&sat=-20'
    ],
    productType: 'Sneakers',
    material: 'Leather',
    collections: ['accessories', 'footwear', 'new-arrivals']
  }),
  makeProduct({
    id: 'everyday-cap',
    handle: 'everyday-cap',
    title: 'Everyday Cap',
    description: 'A six-panel cotton cap with an adjustable fit and understated finish.',
    amount: '34.00',
    image:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=85',
    productType: 'Caps',
    material: 'Cotton',
    collections: ['accessories', 'headwear', 'new-arrivals']
  }),
  makeProduct({
    id: 'linen-shirt',
    handle: 'linen-shirt',
    title: 'Relaxed Linen Shirt',
    description: 'Breathable linen with a relaxed silhouette for warm days and late nights.',
    amount: '84.00',
    image:
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85&sat=-20'
    ],
    productType: 'Shirts',
    material: 'Linen',
    collections: ['clothing', 'new-arrivals']
  }),
  makeProduct({
    id: 'everyday-tee',
    handle: 'everyday-tee',
    title: 'Everyday Cotton Tee',
    description: 'A soft, substantial cotton tee with an easy fit for daily wear.',
    amount: '38.00',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85',
    productType: 'T-shirts',
    material: 'Cotton',
    collections: ['clothing', 'new-arrivals']
  }),
  makeProduct({
    id: 'straight-leg-denim',
    handle: 'straight-leg-denim',
    title: 'Straight Leg Denim',
    description: 'Classic mid-rise denim with a relaxed straight leg and a clean finish.',
    amount: '98.00',
    image:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=85',
    productType: 'Jeans',
    material: 'Denim',
    collections: ['clothing', 'featured']
  }),
  makeProduct({
    id: 'crossbody-bag',
    handle: 'crossbody-bag',
    title: 'Everyday Crossbody',
    description: 'A compact hands-free bag with room for all your daily essentials.',
    amount: '68.00',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
    productType: 'Crossbody bags',
    material: 'Leather',
    collections: ['accessories', 'bags', 'new-arrivals']
  }),
  makeProduct({
    id: 'weekender-duffel',
    handle: 'weekender-duffel',
    title: 'Canvas Weekender',
    description: 'A sturdy canvas carryall sized for quick getaways and gym days.',
    amount: '112.00',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    productType: 'Travel bags',
    material: 'Canvas',
    collections: ['accessories', 'bags', 'featured']
  }),
  makeProduct({
    id: 'canvas-slip-on',
    handle: 'canvas-slip-on',
    title: 'Canvas Slip-On',
    description: 'An easy-on canvas shoe with a flexible sole for laid-back days.',
    amount: '72.00',
    image:
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=85',
    productType: 'Slip-on shoes',
    material: 'Canvas',
    collections: ['accessories', 'footwear', 'new-arrivals']
  }),
  makeProduct({
    id: 'leather-loafer',
    handle: 'leather-loafer',
    title: 'Everyday Leather Loafer',
    description: 'A clean leather loafer with a cushioned footbed for all-day comfort.',
    amount: '126.00',
    image:
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1200&q=85',
    productType: 'Loafers',
    material: 'Leather',
    collections: ['accessories', 'footwear', 'featured']
  }),
  makeProduct({
    id: 'cotton-bucket-hat',
    handle: 'cotton-bucket-hat',
    title: 'Cotton Bucket Hat',
    description: 'A lightweight cotton bucket hat made for sunny afternoons outdoors.',
    amount: '32.00',
    image:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85',
    productType: 'Bucket hats',
    material: 'Cotton',
    collections: ['accessories', 'headwear', 'new-arrivals']
  }),
  makeProduct({
    id: 'rib-knit-beanie',
    handle: 'rib-knit-beanie',
    title: 'Rib Knit Beanie',
    description: 'A soft ribbed knit beanie that brings warmth to cool-weather layers.',
    amount: '36.00',
    image:
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1200&q=85',
    productType: 'Beanies',
    material: 'Wool blend',
    collections: ['accessories', 'headwear', 'featured']
  }),
  makeProduct({
    id: 'everyday-sunglasses',
    handle: 'everyday-sunglasses',
    title: 'Everyday Sunglasses',
    description: 'Lightweight frames with a timeless shape for bright days out.',
    amount: '54.00',
    image:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=85',
    productType: 'Sunglasses',
    material: 'Acetate',
    collections: ['accessories', 'new-arrivals']
  }),
  makeProduct({
    id: 'leather-card-holder',
    handle: 'leather-card-holder',
    title: 'Leather Card Holder',
    description: 'A slim leather essential with just enough room for the everyday.',
    amount: '44.00',
    image:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85',
    productType: 'Card holders',
    material: 'Leather',
    collections: ['accessories', 'featured']
  })
];

const collections: Collection[] = [
  {
    handle: 'clothing',
    title: 'Clothing',
    description: 'Everyday layers, considered and easy to wear.',
    seo: { title: 'Clothing', description: 'Shop considered everyday clothing.' },
    updatedAt,
    path: '/search/clothing'
  },
  {
    handle: 'accessories',
    title: 'Accessories',
    description: 'Useful, well-made pieces for the everyday.',
    seo: { title: 'Accessories', description: 'Shop everyday accessories.' },
    updatedAt,
    path: '/search/accessories'
  },
  {
    handle: 'bags',
    title: 'Bags',
    description: 'Easy carryalls and everyday bags for wherever the day takes you.',
    seo: { title: 'Bags', description: 'Shop everyday bags and carryalls.' },
    updatedAt,
    path: '/search/bags'
  },
  {
    handle: 'footwear',
    title: 'Footwear',
    description: 'Comfortable, versatile shoes made to keep you moving.',
    seo: { title: 'Footwear', description: 'Shop comfortable everyday footwear.' },
    updatedAt,
    path: '/search/footwear'
  },
  {
    handle: 'headwear',
    title: 'Headwear',
    description: 'Finishing touches for sunny days and everyday wear.',
    seo: { title: 'Headwear', description: 'Shop everyday hats and caps.' },
    updatedAt,
    path: '/search/headwear'
  },
  {
    handle: 'new-arrivals',
    title: 'New arrivals',
    description: 'The latest additions to the collection.',
    seo: { title: 'New arrivals', description: 'Explore our latest arrivals.' },
    updatedAt,
    path: '/search/new-arrivals'
  }
];

const pages: StorePage[] = [
  {
    id: 'about',
    title: 'About Us',
    handle: 'about',
    body: `
<h2>Who We Are</h2>
<p>Leather Mart 313 is a family-run leather goods manufacturer based in Amravati, Maharashtra. For over a decade we have been crafting original leather products — bags, wallets, belts, and accessories — directly from our workshop at Shop No. B47, Hazrat Tipu Sultan AMC Market, Walgaon Road.</p>
<p>We are not a reseller. Every product you see is made by us, which means you get manufacturer quality at honest prices with no middlemen in between.</p>

<h2>Our Craft</h2>
<p>We work with full-grain and genuine leather sourced from trusted tanneries. Each piece is cut, stitched, and finished by hand in our Amravati workshop. We pay attention to the details that matter — reinforced stitching, solid hardware, and edges that are burnished rather than painted.</p>
<p>Leather is a natural material that improves with age. The bags and wallets we make are designed to be used every day and to develop a rich patina over years of use. We build them to outlast trends.</p>

<h2>Made in Amravati</h2>
<p>We are proudly local. Our workshop is in Transport Nagar, Amravati — a city with a long tradition of leather craft. When you buy from Leather Mart 313 you are supporting a small family business and skilled artisans from our community.</p>
<p>You are always welcome to visit us in person, see the workshop, and pick your piece directly.</p>

<h2>Why Buy From Us</h2>
<ul>
  <li><strong>Direct from manufacturer</strong> — no distributor markup, genuine products every time.</li>
  <li><strong>Honest materials</strong> — we tell you exactly what leather we use and how it is made.</li>
  <li><strong>Built to last</strong> — we stand behind our work. If something is wrong, we fix it.</li>
  <li><strong>Personal service</strong> — call or WhatsApp us directly at 093265 69083. You speak to the people who made your product.</li>
</ul>

<h2>Visit Us</h2>
<p>Shop No. B47, Hazrat Tipu Sultan AMC Market, Walgaon Rd, Jameel Colony, Transport Nagar, Amravati, Maharashtra 444601.</p>
<p>We are open seven days a week. Give us a call before you visit and we will make sure the full range is out for you.</p>
    `.trim(),
    bodySummary: 'Leather Mart 313 is a family-run leather goods manufacturer in Amravati, Maharashtra — crafting original bags, wallets, and accessories directly from our workshop since over a decade.',
    seo: {
      title: 'About Us — Leather Mart 313',
      description: 'Leather Mart 313 is a family-run leather goods manufacturer based in Amravati, Maharashtra. Original leather products, made by hand, direct from our workshop.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'contact',
    title: 'Contact',
    handle: 'contact',
    body: '<p>Have a question? Add your business email and contact details here before launch.</p>',
    bodySummary: 'Get in touch with our team.',
    seo: { title: 'Contact', description: 'Contact our team.' },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    handle: 'privacy-policy',
    body: '<p><strong>Store owner: complete and review this policy before launch.</strong> Replace bracketed prompts with your business details and confirm that this policy reflects your actual practices and applicable law.</p><h2>Information we collect</h2><p>When you use the store, information may be provided directly by you (for example, when you contact us) or collected as needed to operate the site. This demo currently uses an essential HTTP-only cookie to remember cart contents. It does not currently provide customer accounts or collect newsletter signups.</p><p>Before accepting orders, explain what personal and order information your store collects, why it is needed, and what service providers process it. Include analytics, advertising, payment, and hosting providers if you use them.</p><h2>How we use information</h2><p>Describe how information is used to operate the store, respond to requests, process orders, prevent fraud, and meet legal obligations. Do not use customer information for unrelated marketing without an appropriate legal basis and any required consent.</p><h2>Sharing and retention</h2><p>List the service providers and other parties that receive personal information, the reasons for sharing, and how long information is retained. Explain any international transfers that apply to your business.</p><h2>Your choices and rights</h2><p>Depending on where you live, you may have rights to access, correct, delete, or receive a copy of your personal information, or to object to certain processing. Add instructions for submitting requests and any applicable appeal process.</p><h2>Cookies and contact</h2><p>Explain the cookies and similar technologies your live store uses and how visitors can manage them. For privacy questions or requests, contact <strong>[add your privacy contact email and business address]</strong>.</p><p>Effective date: <strong>[add date]</strong>.</p>',
    bodySummary: 'Learn what information the store handles and the choices available to you.',
    seo: {
      title: 'Privacy Policy',
      description: 'How we handle personal information and privacy requests.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    handle: 'terms-of-service',
    body: '<p><strong>Store owner: complete and review these terms before launch.</strong> Fill in bracketed prompts, confirm the terms match your actual checkout and fulfillment practices, and get appropriate legal review.</p><h2>About these terms</h2><p>These terms apply to your use of this website, operated by <strong>[add your legal business name and address]</strong>. By using the site, you agree to the terms applicable in your location. If you do not agree, do not use the site.</p><h2>Products and pricing</h2><p>We aim to show product descriptions, images, availability, and prices accurately. Colors may appear differently on different displays. Prices, taxes, shipping charges, and availability must be confirmed at checkout before an order is accepted. We may correct errors and cancel an order where permitted by law.</p><h2>Orders and payment</h2><p>An order is accepted only when we send an order confirmation. Add the payment methods you accept and explain when payment is taken. This demo storefront checkout is a preview and does not currently accept payment or place orders.</p><h2>Shipping, returns, and acceptable use</h2><p>Shipping and return conditions are described in our <a href="/shipping-delivery">Shipping &amp; Delivery</a> and <a href="/returns-refunds">Returns &amp; Refunds</a> policies. Do not misuse the site, interfere with its operation, or use it in violation of law.</p><h2>Liability and changes</h2><p>Nothing in these terms limits rights or remedies that cannot be limited under applicable law. Add any lawful limitations, complaint process, governing law, and dispute-resolution details applicable to your business: <strong>[complete after legal review]</strong>. We may update these terms by publishing a revised version with an updated effective date.</p><p>Effective date: <strong>[add date]</strong>. Questions: <strong>[add contact email]</strong>.</p>',
    bodySummary: 'Terms for using the storefront and placing orders.',
    seo: { title: 'Terms of Service', description: 'Terms and conditions for using our store.' },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'shipping-delivery',
    title: 'Shipping & Delivery',
    handle: 'shipping-delivery',
    body: '<p><strong>Store owner: add your real shipping information before accepting orders.</strong> Shipping prices, carriers, delivery estimates, and service areas depend on your business and must be accurate at checkout.</p><h2>Where we ship</h2><p>We currently ship to <strong>[list countries or regions served]</strong>. We do not ship to <strong>[list exclusions, if any]</strong>.</p><h2>Processing and delivery estimates</h2><p>Orders are typically prepared within <strong>[add processing time]</strong>. Estimated delivery after dispatch is <strong>[add estimates by region and service]</strong>. Estimates are not guarantees; carrier delays, customs, weather, or other events may affect delivery.</p><h2>Shipping charges and tracking</h2><p>Available shipping methods and charges are shown at checkout before purchase. Add details about free-shipping thresholds and when tracking information is sent: <strong>[complete shipping details]</strong>.</p><h2>Customs, address changes, and delivery issues</h2><p>For international orders, explain who pays import duties and taxes. Contact us promptly about an incorrect address, delayed parcel, or delivery issue at <strong>[add support email]</strong>. Add any address-change or undeliverable-parcel rules here.</p><p>This demo storefront does not currently accept or fulfill orders.</p>',
    bodySummary: 'Shipping regions, charges, processing times, and delivery information.',
    seo: {
      title: 'Shipping & Delivery',
      description: 'Shipping regions, costs, and delivery estimates.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'returns-refunds',
    title: 'Returns & Refunds',
    handle: 'returns-refunds',
    body: '<p><strong>Store owner: set a return policy that complies with the laws where you sell before accepting orders.</strong> Replace each bracketed prompt with your actual process and timelines.</p><h2>Return window and eligibility</h2><p>Eligible items may be returned within <strong>[add return window and when it begins]</strong>. State the condition required, whether tags and original packaging must be included, and any exclusions. Any exclusions must comply with applicable consumer-protection laws.</p><h2>How to request a return</h2><p>Contact <strong>[add returns email or return portal]</strong> with your order number and reason for return. Wait for return instructions before sending an item. Add who pays return shipping and the return address or process here.</p><h2>Refunds and exchanges</h2><p>After an approved return is received and inspected, explain when refunds are issued, which payment method is refunded, and whether original shipping charges are refundable. Add your exchange and damaged-or-incorrect-item process.</p><h2>Cancellation and local rights</h2><p>Explain how to request an order cancellation and any applicable conditions. This policy does not remove consumer rights that cannot be excluded under applicable law.</p><p>This demo storefront checkout does not currently place orders or issue refunds. Questions: <strong>[add support email]</strong>.</p>',
    bodySummary: 'How to request a return, exchange, or refund.',
    seo: { title: 'Returns & Refunds', description: 'Return, exchange, and refund information.' },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    handle: 'disclaimer',
    body: '<p><strong>Store owner: review this page for your business and local law before launch.</strong> This general information is not a substitute for legal advice.</p><h2>Product information</h2><p>We make reasonable efforts to describe products accurately, but product images, colors, measurements, and availability may vary. Confirm important product details before purchasing and contact us if you need clarification.</p><h2>Website information</h2><p>Content on this site is provided for general informational purposes. To the extent permitted by applicable law, we do not guarantee that all site content is complete, current, or error-free. This does not limit any rights or remedies that cannot legally be limited.</p><h2>External links</h2><p>Links to third-party sites are provided for convenience. We do not control their content or privacy practices; review their terms and policies before using them.</p><h2>Demo storefront notice</h2><p>This independent storefront currently uses sample catalog data. Checkout is a preview and does not accept payment or place orders. Product offers, inventory, shipping details, and policies must be replaced with verified business information before launch.</p><p>Questions: <strong>[add contact email]</strong>.</p>',
    bodySummary: 'Important information about site content and the demo storefront.',
    seo: {
      title: 'Disclaimer',
      description: 'Important information about our website and content.'
    },
    createdAt: updatedAt,
    updatedAt
  }
];

const footerMenu: MenuItem[] = [
  { title: 'About', path: '/about' },
  { title: 'Contact', path: '/contact' },
  { title: 'Privacy Policy', path: '/privacy-policy' },
  { title: 'Terms of Service', path: '/terms-of-service' },
  { title: 'Shipping & Delivery', path: '/shipping-delivery' },
  { title: 'Returns & Refunds', path: '/returns-refunds' },
  { title: 'Disclaimer', path: '/disclaimer' }
];

type ProductQuery = {
  query?: string;
  sortKey?: SortKey;
  reverse?: boolean;
  minPrice?: number;
  maxPrice?: number;
  productType?: string[];
  material?: string[];
  color?: string[];
  size?: string[];
  inStock?: boolean;
};

function sortProducts(
  items: Product[],
  { sortKey = defaultSort.sortKey, reverse = false }: ProductQuery
) {
  const sorted = [...items];
  if (sortKey === 'PRICE') {
    sorted.sort(
      (a, b) =>
        Number(a.priceRange.minVariantPrice.amount) - Number(b.priceRange.minVariantPrice.amount)
    );
  } else if (sortKey === 'CREATED_AT') {
    sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } else if (sortKey === 'BEST_SELLING') {
    sorted.reverse();
  }
  return reverse ? sorted.reverse() : sorted;
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const searchTerm = query.query?.toLowerCase();
  const catalog = await getCatalogProducts(products);
  const filteredProducts = catalog.filter((product) => {
    const amount = Number(product.priceRange.minVariantPrice.amount);
    return (
      (!searchTerm ||
        `${product.title} ${product.description}`.toLowerCase().includes(searchTerm)) &&
      (query.minPrice === undefined || amount >= query.minPrice) &&
      (query.maxPrice === undefined || amount <= query.maxPrice) &&
      (!query.productType?.length || query.productType.includes(product.productType)) &&
      (!query.material?.length || query.material.includes(product.material)) &&
      (!query.color?.length || product.colors.some((color) => query.color?.includes(color))) &&
      (!query.size?.length || product.sizes.some((size) => query.size?.includes(size))) &&
      (!query.inStock || product.availableForSale)
    );
  });

  return sortProducts(filteredProducts, query);
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const catalog = await getCatalogProducts(products);
  return catalog.find((product) => product.handle === `/product/${handle}`);
}

/**
 * Returns all collections including hidden ones. Used by admin pages.
 */
export async function getAllCollections(): Promise<Collection[]> {
  return getManagedCollections(collections);
}

/**
 * Returns visible (non-hidden) collections for the storefront.
 */
export async function getCollections(): Promise<Collection[]> {
  const all = await getManagedCollections(collections);
  return all.filter((collection) => !collection.hidden);
}

export async function getCollection(handle: string): Promise<Collection | undefined> {
  const all = await getManagedCollections(collections);
  return all.find((collection) => collection.handle === handle);
}

export async function getCollectionProducts({
  collection,
  sortKey,
  reverse,
  minPrice,
  maxPrice,
  productType,
  material,
  color,
  size,
  inStock
}: ProductQuery & { collection: string }): Promise<Product[]> {
  const catalog = await getCatalogProducts(products);
  const matching = catalog.filter((product) => {
    const amount = Number(product.priceRange.minVariantPrice.amount);
    return (
      product.collectionHandles.includes(collection) &&
      (minPrice === undefined || amount >= minPrice) &&
      (maxPrice === undefined || amount <= maxPrice) &&
      (!productType?.length || productType.includes(product.productType)) &&
      (!material?.length || material.includes(product.material)) &&
      (!color?.length || product.colors.some((value) => color.includes(value))) &&
      (!size?.length || product.sizes.some((value) => size.includes(value))) &&
      (!inStock || product.availableForSale)
    );
  });
  return sortProducts(matching, { sortKey, reverse });
}

export async function getProductFilterOptions() {
  const catalog = await getCatalogProducts(products);
  return {
    productTypes: Array.from(new Set(catalog.map((product) => product.productType))).sort(),
    materials: Array.from(new Set(catalog.map((product) => product.material))).sort(),
    colors: Array.from(new Set(catalog.flatMap((product) => product.colors))).sort(),
    sizes: Array.from(new Set(catalog.flatMap((product) => product.sizes))).sort()
  };
}

export function parsePriceFilter(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export function parseMultiValueFilter(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter((item) => item.length > 0);
}

export async function getProductRecommendations(id: string): Promise<Product[]> {
  const catalog = await getCatalogProducts(products);
  const product = catalog.find((item) => item.id === id);
  if (!product) return [];
  return catalog
    .filter(
      (item) =>
        item.id !== id &&
        item.collectionHandles.some((handle) => product.collectionHandles.includes(handle))
    )
    .slice(0, 4);
}

export async function getMenu(location: 'header' | 'footer'): Promise<MenuItem[]> {
  if (location === 'header') {
    const collections = await getCollections();
    return [
      { title: 'Shop all', path: '/search' },
      ...collections.map(({ title, path }) => ({ title, path })),
      { title: 'About', path: '/about' }
    ];
  }
  return footerMenu;
}

export async function getPages(): Promise<StorePage[]> {
  return pages;
}

export async function getPage(handle: string): Promise<StorePage | undefined> {
  return pages.find((page) => page.handle === handle);
}

export function parseCartLines(value?: string): CartLine[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line?.variantId === 'string' &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0 &&
        line.quantity <= 99 &&
        products.some((product) =>
          product.variants.some((variant) => variant.id === line.variantId)
        )
    );
  } catch {
    return [];
  }
}

export async function getCart(lines: CartLine[]): Promise<Cart> {
  const catalog = await getCatalogProducts(products);
  const cartItems = lines.flatMap((line) => {
    const product = catalog.find((item) =>
      item.variants.some((variant) => variant.id === line.variantId)
    );
    const variant = product?.variants.find((item) => item.id === line.variantId);
    if (!product || !variant || !variant.availableForSale) return [];
    const quantity = Math.min(line.quantity, variant.inventoryQuantity);
    if (quantity < 1) return [];

    const amount = Number(variant.price.amount) * quantity;
    return [
      {
        id: line.variantId,
        quantity,
        cost: { totalAmount: { amount: amount.toFixed(2), currencyCode } },
        merchandise: {
          id: variant.id,
          title: variant.title,
          selectedOptions: variant.selectedOptions,
          product
        }
      }
    ];
  });
  const total = cartItems.reduce((sum, item) => sum + Number(item.cost.totalAmount.amount), 0);
  const money = { amount: total.toFixed(2), currencyCode };

  return {
    id: 'local-cart',
    checkoutUrl: '',
    cost: {
      subtotalAmount: money,
      totalAmount: money,
      totalTaxAmount: { amount: '0.00', currencyCode }
    },
    lines: cartItems,
    totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0)
  };
}
