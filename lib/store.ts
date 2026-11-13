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
    body: `
<p>This Privacy Policy explains how Leather Mart 313 ("we", "us", "our") collects, uses, and protects your personal information when you visit leathermart313.in or place an order with us. By using this website you agree to this policy.</p>

<h2>Information We Collect</h2>
<p>When you place an order or create an account, we collect your name, email address, phone number, and delivery address. We also collect your order history and payment confirmation details (we do not store card numbers — payments are processed securely by Cashfree Payments). We use an essential cookie to remember your shopping cart between visits.</p>

<h2>How We Use Your Information</h2>
<ul>
  <li>To process and fulfil your orders and send order confirmations.</li>
  <li>To contact you about your order status, delivery, or any issues.</li>
  <li>To respond to your enquiries and provide customer support.</li>
  <li>To improve our website and product offerings.</li>
</ul>
<p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

<h2>Service Providers</h2>
<p>We use the following trusted third-party services to operate our store: Cashfree Payments (payment processing), Supabase (order and customer data storage), Vercel (website hosting), and Clerk (account authentication). Each provider handles data under their own privacy policies and applicable law.</p>

<h2>Data Retention</h2>
<p>We retain order and customer information for as long as necessary to fulfil orders, comply with legal obligations, and resolve disputes. You may request deletion of your account and associated data by contacting us at the details below.</p>

<h2>Your Rights</h2>
<p>You have the right to access, correct, or request deletion of the personal information we hold about you. To make a request, contact us at <strong>info@leathermart313.com</strong> or call <strong>093265 69083</strong>.</p>

<h2>Cookies</h2>
<p>We use a single essential cookie to maintain your shopping cart. No advertising or tracking cookies are used. You can disable cookies in your browser settings, but this may affect cart functionality.</p>

<h2>Contact</h2>
<p>Leather Mart 313, Shop No. B47, Hazrat Tipu Sultan AMC Market, Walgaon Rd, Amravati, Maharashtra 444601. Email: info@leathermart313.com · Phone: 093265 69083.</p>
<p><em>Effective date: November 2026.</em></p>
    `.trim(),
    bodySummary: 'How Leather Mart 313 collects, uses, and protects your personal information.',
    seo: {
      title: 'Privacy Policy — Leather Mart 313',
      description: 'How Leather Mart 313 collects, uses and protects your personal information when you shop with us.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    handle: 'terms-of-service',
    body: `
<p>These Terms of Service govern your use of leathermart313.in and any purchase you make from Leather Mart 313, Shop No. B47, Hazrat Tipu Sultan AMC Market, Walgaon Rd, Jameel Colony, Transport Nagar, Amravati, Maharashtra 444601. By placing an order you agree to these terms.</p>

<h2>Products and Pricing</h2>
<p>All products are handcrafted leather goods manufactured directly by us. We make every effort to display accurate images, descriptions, and prices. Leather is a natural material — grain patterns, texture, and colour may vary slightly between pieces. All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.</p>

<h2>Orders and Payment</h2>
<p>An order is confirmed when you receive a payment confirmation from Cashfree Payments and an order confirmation from us. We accept payments via UPI, debit/credit cards, net banking, and wallets through Cashfree. We reserve the right to cancel an order if a product becomes unavailable or if a pricing error is identified, in which case a full refund will be issued.</p>

<h2>Shipping and Delivery</h2>
<p>Please refer to our <a href="/shipping-delivery">Shipping &amp; Delivery</a> policy for full details on delivery timelines, charges, and tracking.</p>

<h2>Returns and Refunds</h2>
<p>Please refer to our <a href="/returns-refunds">Returns &amp; Refunds</a> policy. Refunds are only available within 4 days of receiving your order and are subject to the conditions set out in that policy.</p>

<h2>Intellectual Property</h2>
<p>All content on this website — including images, text, logos, and product descriptions — is owned by or licensed to Leather Mart 313. You may not reproduce or use any content without our prior written permission.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Leather Mart 313 is not liable for any indirect, incidental, or consequential loss arising from the use of this website or our products. Our total liability for any claim shall not exceed the amount paid for the product in question.</p>

<h2>Governing Law</h2>
<p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Amravati, Maharashtra.</p>

<h2>Changes to These Terms</h2>
<p>We may update these terms from time to time. The current version will always be available on this page. Continued use of the website after changes constitutes acceptance of the updated terms.</p>

<p><em>Effective date: November 2026. Questions: info@leathermart313.com · 093265 69083.</em></p>
    `.trim(),
    bodySummary: 'Terms and conditions for using leathermart313.in and placing orders.',
    seo: {
      title: 'Terms of Service — Leather Mart 313',
      description: 'Terms and conditions for using the Leather Mart 313 website and placing orders.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'shipping-delivery',
    title: 'Shipping & Delivery',
    handle: 'shipping-delivery',
    body: `
<p>Leather Mart 313 ships all orders across India from our workshop in Amravati, Maharashtra. Here is everything you need to know about how we get your order to you.</p>

<h2>Processing Time</h2>
<p>Orders are processed within <strong>1–2 business days</strong> of payment confirmation. For custom or made-to-order pieces, processing may take up to 5 business days — we will confirm this at the time of order.</p>

<h2>Delivery Estimates</h2>
<ul>
  <li><strong>Maharashtra:</strong> 2–4 business days after dispatch.</li>
  <li><strong>Rest of India:</strong> 4–7 business days after dispatch.</li>
  <li><strong>Remote areas:</strong> Up to 10 business days.</li>
</ul>
<p>These are estimates only. Actual delivery times may vary due to courier delays, public holidays, or other circumstances outside our control.</p>

<h2>Shipping Charges</h2>
<p>Shipping charges, if applicable, are calculated and displayed at checkout before you complete your order. Orders above the free-shipping threshold qualify for free delivery — the current threshold is shown on the checkout page.</p>

<h2>Tracking Your Order</h2>
<p>Once your order is dispatched, we will send you the tracking number and courier details via WhatsApp or email. You can also check your order status by logging into your account and visiting My Orders.</p>

<h2>Delivery Issues</h2>
<p>If your order has not arrived within the estimated timeframe, or if the package appears damaged on delivery, please contact us immediately at <strong>093265 69083</strong> or <strong>info@leathermart313.com</strong>. Do not accept a visibly damaged package — refuse delivery and contact us right away.</p>

<h2>Address Changes</h2>
<p>If you need to update your delivery address after placing an order, contact us as soon as possible. We can update the address before dispatch, but we cannot reroute a package once it has been handed to the courier.</p>

<p><em>Questions? Call or WhatsApp us at 093265 69083.</em></p>
    `.trim(),
    bodySummary: 'Delivery timelines, shipping charges, tracking, and what to do if something goes wrong.',
    seo: {
      title: 'Shipping & Delivery — Leather Mart 313',
      description: 'Shipping information for Leather Mart 313 — delivery timelines, charges, tracking and delivery FAQs.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'returns-refunds',
    title: 'Returns & Refunds',
    handle: 'returns-refunds',
    body: `
<p>At Leather Mart 313 we take pride in the quality of every product we make. If something is not right with your order, we want to make it right. Please read our return and refund policy carefully before initiating a return.</p>

<h2>Return Window</h2>
<p>Returns are accepted within <strong>4 days of the date you receive your order</strong>. Requests made after 4 days of delivery will not be eligible for a return or refund.</p>

<h2>Eligibility Conditions</h2>
<p>To qualify for a return, the item must meet all of the following conditions:</p>
<ul>
  <li>The return request is raised within 4 days of delivery.</li>
  <li>The item is unused, unworn, and in its original condition.</li>
  <li>The item is returned in its original packaging with all tags intact.</li>
  <li>The item has not been altered, washed, or damaged after delivery.</li>
</ul>

<h2>Non-Returnable Items</h2>
<ul>
  <li>Items that show signs of use, wear, or damage caused after delivery.</li>
  <li>Custom or personalised products made to your specifications.</li>
  <li>Items returned after the 4-day window.</li>
  <li>Sale or clearance items (unless defective).</li>
</ul>

<h2>How to Initiate a Return</h2>
<ol>
  <li>Contact us within 4 days of delivery on <strong>093265 69083</strong> (WhatsApp or call) or email <strong>info@leathermart313.com</strong>.</li>
  <li>Share your order number and clear photographs of the item and the reason for return.</li>
  <li>Wait for our team to review and approve the return request.</li>
  <li>Once approved, ship the item back to us at the address provided. Return shipping costs are borne by the customer unless the item is defective or incorrectly sent.</li>
</ol>

<h2>Refunds</h2>
<p>Once we receive and inspect the returned item, we will notify you of approval or rejection within 2 business days. If approved, the refund will be processed to your original payment method within <strong>5–7 business days</strong>. The exact timeline depends on your bank or payment provider.</p>
<p>Original shipping charges are non-refundable unless the return is due to a defective or incorrect item.</p>

<h2>Defective or Wrong Items</h2>
<p>If you receive a defective product or the wrong item, contact us immediately. We will arrange a free return pickup and either replace the item or issue a full refund — your choice.</p>

<h2>Cancellations</h2>
<p>Orders can be cancelled before dispatch. Once an order has been dispatched, it cannot be cancelled — the returns process above applies. To request a cancellation, contact us as soon as possible at 093265 69083.</p>

<p><em>Questions? Call or WhatsApp us at 093265 69083 or email info@leathermart313.com.</em></p>
    `.trim(),
    bodySummary: 'Returns accepted within 4 days of delivery. Items must be unused and in original condition.',
    seo: {
      title: 'Returns & Refunds — Leather Mart 313',
      description: 'Leather Mart 313 returns and refund policy — returns accepted within 4 days of delivery for unused items in original condition.'
    },
    createdAt: updatedAt,
    updatedAt
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    handle: 'disclaimer',
    body: `
<p>The information on this website (leathermart313.in) is provided by Leather Mart 313 for general informational and commercial purposes. By using this website you accept this disclaimer in full.</p>

<h2>Product Information</h2>
<p>All products sold by Leather Mart 313 are handcrafted from genuine leather. Because leather is a natural material, every piece is unique — grain patterns, texture, and colour tone may vary slightly from product photographs. These variations are not defects; they are characteristics of authentic leather.</p>
<p>We make every reasonable effort to ensure product descriptions, images, dimensions, and pricing are accurate. However, we cannot guarantee that your device screen displays colours exactly as they appear in person. If you have specific questions about a product before purchasing, please contact us.</p>

<h2>Pricing and Availability</h2>
<p>All prices are in Indian Rupees (₹). Product availability and prices are subject to change without notice. We reserve the right to correct pricing errors and to limit or refuse orders where appropriate.</p>

<h2>Website Content</h2>
<p>Content on this website is provided in good faith and for general information only. We do not warrant that the website will be uninterrupted, error-free, or free from viruses. We are not liable for any loss or damage arising from your use of the website or reliance on its content.</p>

<h2>External Links</h2>
<p>This website may contain links to third-party websites (such as payment gateways or social media). These links are provided for convenience only. We have no control over the content or practices of external sites and accept no responsibility for them. Visiting external links is at your own risk.</p>

<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by Indian law, Leather Mart 313 shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this website, the purchase of our products, or reliance on any information provided here. Our liability is limited to the amount paid for the specific product giving rise to the claim.</p>

<h2>Contact</h2>
<p>If you have any questions about this disclaimer, please contact us at <strong>info@leathermart313.com</strong> or call <strong>093265 69083</strong>.</p>
<p>Leather Mart 313, Shop No. B47, Hazrat Tipu Sultan AMC Market, Walgaon Rd, Amravati, Maharashtra 444601.</p>
<p><em>Last updated: November 2026.</em></p>
    `.trim(),
    bodySummary: 'Important information about product variations, pricing, website content, and liability.',
    seo: {
      title: 'Disclaimer — Leather Mart 313',
      description: 'Disclaimer for leathermart313.in covering product information, pricing, website content, and limitation of liability.'
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
