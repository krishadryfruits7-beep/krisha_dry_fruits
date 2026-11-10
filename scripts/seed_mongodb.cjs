const mongoose = require('mongoose');

const CLOUDINARY_URLS = {
  hero_bowls: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784659/krisha_dry_fruits/products/hero_bowls.png",
  cat_nuts: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784660/krisha_dry_fruits/products/cat_nuts.jpg",
  cat_dates: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784661/krisha_dry_fruits/products/cat_dates.jpg",
  cat_dried_fruits: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784662/krisha_dry_fruits/products/cat_dried_fruits.jpg",
  cat_seeds: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784663/krisha_dry_fruits/products/cat_seeds.jpg",
  cat_hampers: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784664/krisha_dry_fruits/products/cat_hampers.jpg",
  prod_almonds: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784664/krisha_dry_fruits/products/prod_almonds.jpg",
  prod_cashews: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784666/krisha_dry_fruits/products/prod_cashews.jpg",
  prod_pistachios: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784667/krisha_dry_fruits/products/prod_pistachios.jpg",
  prod_dates: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784668/krisha_dry_fruits/products/prod_dates.jpg",
  logo: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784669/krisha_dry_fruits/products/logo.png",
  almonds_mamra: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784692/krisha_dry_fruits/catalog/almonds_mamra.jpg",
  walnuts_kashmiri: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784693/krisha_dry_fruits/catalog/walnuts_kashmiri.jpg",
  walnuts_chilean: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784694/krisha_dry_fruits/catalog/walnuts_chilean.jpg",
  cashews_w240: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784696/krisha_dry_fruits/catalog/cashews_w240.jpg",
  cashews_w320: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784697/krisha_dry_fruits/catalog/cashews_w320.jpg",
  pistachios_emerald: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784698/krisha_dry_fruits/catalog/pistachios_emerald.jpg",
  figs_afghan: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784699/krisha_dry_fruits/catalog/figs_afghan.jpg",
  raisins_green: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784700/krisha_dry_fruits/catalog/raisins_green.jpg",
  seeds_7in1: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784701/krisha_dry_fruits/catalog/seeds_7in1.jpg",
  gift_imperial: "https://res.cloudinary.com/dqb3zf1bw/image/upload/v1793784702/krisha_dry_fruits/catalog/gift_imperial.jpg"
};

const QUANTITIES = ['250g', '500g', '1kg', '2kg', '5kg'];

function roundToTen(n) {
  return Math.round(n / 10) * 10;
}

function makePriceTier(basePerKg, multiplier = 1.0) {
  const weightMap = { '250g': 0.25, '500g': 0.5, '1kg': 1.0, '2kg': 2.0, '5kg': 5.0 };
  const discountMap = { '250g': 1.0, '500g': 0.97, '1kg': 0.93, '2kg': 0.88, '5kg': 0.82 };
  return QUANTITIES.map(q => ({
    quantity: q,
    price: roundToTen(basePerKg * multiplier * weightMap[q] * discountMap[q])
  }));
}

const MOCK_PRODUCTS = [
  {
    grade: 'California Jumbo',
    name: 'California Nonpareil Extra Jumbo Almonds',
    category: 'almonds',
    categoryLabel: 'Premium Almonds',
    tagline: 'Imported Premium Caliber — Sweet Crunch & Golden Smooth Shell',
    description: 'Imported directly from the orchards of the Central Valley in California. Hand-sorted for extra-large uniform size, paper-thin skin, and a sweet, crisp crunch.',
    longDescription: 'Nonpareil is the gold standard of California almonds. Clean, uniform, and delicately sweet, they are perfect for daily breakfasts, smoothies, baking, or energizing work-desk snacking.',
    origin: 'California, United States',
    gradeDescription: 'Nonpareil Extra #1 grade, 20/22 caliber, double laser sorted.',
    image: CLOUDINARY_URLS.prod_almonds,
    gallery: [CLOUDINARY_URLS.prod_almonds, CLOUDINARY_URLS.almonds_mamra],
    rating: 4.92,
    reviewCount: 310,
    badge: 'Bestseller',
    priority: 100,
    active: true,
    healthBenefits: [
      'High plant protein for lean muscle repair',
      'Packed with dietary fiber to support gut microbiome',
      'Rich in antioxidant flavonoids in the natural skin'
    ],
    nutritionalHighlights: {
      calories: '579 kcal / 100g',
      protein: '21.2g',
      fiber: '11.8g',
      healthyFats: '49.0g',
      keyNutrient: 'Plant Protein & Calcium'
    },
    types: [
      {
        type: 'Raw',
        description: 'Crisp whole raw California almonds with uniform golden skin.',
        image: CLOUDINARY_URLS.prod_almonds,
        prices: makePriceTier(840, 1.0)
      },
      {
        type: 'Roasted & Salted',
        description: 'Dry roasted with pure sea salt for a crunchy, savory satisfaction.',
        image: CLOUDINARY_URLS.prod_almonds,
        prices: makePriceTier(840, 1.15)
      }
    ]
  },
  {
    grade: 'W180',
    name: 'W180 Jumbo King Cashews',
    category: 'cashews',
    categoryLabel: 'Artisanal Cashews',
    tagline: 'King of Cashews — Largest Caliber Whole Coastal Harvest',
    description: 'Our most prestigious cashew grade. Hand-sorted from sun-drenched coastal orchards along Goa and Karwar, boasting extraordinary size, buttery richness, and a pristine ivory color.',
    longDescription: 'W180 represents the absolute pinnacle of cashew grading: only 180 whole kernel nuts make up one pound (453 grams). Every batch is shade-dried, hand-cracked, and strictly non-fumigated. Perfect for royal gifting, festive offerings, or as an indulgent everyday superfood.',
    origin: 'Goa Coastal Belt, India',
    gradeDescription: '170–180 whole kernels per pound. Maximum size, zero artificial polish.',
    image: CLOUDINARY_URLS.prod_cashews,
    gallery: [CLOUDINARY_URLS.prod_cashews, CLOUDINARY_URLS.cashews_w240],
    rating: 4.95,
    reviewCount: 382,
    badge: 'Premium Quality',
    priority: 95,
    active: true,
    healthBenefits: [
      'Heart-healthy monounsaturated fats',
      'Rich in magnesium for bone density',
      'Zero cholesterol and natural zinc source',
      'Instant plant-based vitality'
    ],
    nutritionalHighlights: {
      calories: '553 kcal / 100g',
      protein: '18.2g',
      fiber: '3.3g',
      healthyFats: '43.8g',
      keyNutrient: 'High Magnesium & Copper'
    },
    types: [
      {
        type: 'Raw',
        description: 'Pure, sweet, natural raw cashews straight from the shell. Mild and buttery.',
        image: CLOUDINARY_URLS.prod_cashews,
        prices: makePriceTier(1380, 1.0)
      },
      {
        type: 'Roasted & Salted',
        description: 'Slow dry-roasted to a golden crisp and lightly dusted with crushed sea salt.',
        image: CLOUDINARY_URLS.prod_cashews,
        prices: makePriceTier(1380, 1.15)
      }
    ]
  },
  {
    grade: 'Akbari Jumbo',
    name: 'Iranian Jumbo Roasted & Salted Pistachios',
    category: 'pistachios',
    categoryLabel: 'Gourmet Pistachios',
    tagline: 'Naturally Opened Smiling Pistachios — Deep Nutty Saffron Crunch',
    description: 'Long, elegant Akbari pistachios harvested in the desert oases of Iran. Naturally split on the tree under bright desert sun, roasted with pink salt to enhance their vibrant violet skin and emerald center.',
    longDescription: 'Authentic tree-ripened pistachios open naturally, guaranteeing complete maturity and rich flavor. Zero mechanical cracking or chemical bleaching. Crack open the shell and experience authentic royal Persian pistachio flavor.',
    origin: 'Rafsanjan, Iran',
    gradeDescription: 'Akbari 20/22 naturally open shells, dry-roasted with pink salt.',
    image: CLOUDINARY_URLS.prod_pistachios,
    gallery: [CLOUDINARY_URLS.prod_pistachios, CLOUDINARY_URLS.pistachios_emerald],
    rating: 4.93,
    reviewCount: 345,
    badge: 'Best Value',
    priority: 90,
    active: true,
    healthBenefits: [
      'High in lutein and zeaxanthin for eyesight protection',
      'One of the lowest calorie, highest protein nuts',
      'Contains bioavailable Vitamin B6 and thiamine',
      'Supports gut microbiome via prebiotic fiber'
    ],
    nutritionalHighlights: {
      calories: '562 kcal / 100g',
      protein: '20.3g',
      fiber: '10.6g',
      healthyFats: '45.3g',
      keyNutrient: 'Lutein & Vitamin B6'
    },
    types: [
      {
        type: 'Roasted & Salted',
        description: 'Tree-opened jumbo pistachios roasted with Himalayan pink salt.',
        image: CLOUDINARY_URLS.prod_pistachios,
        prices: makePriceTier(1390, 1.0)
      }
    ]
  },
  {
    grade: 'Medjool Jumbo',
    name: 'Royal Saudi Medjool Jumbo Dates',
    category: 'dates',
    categoryLabel: 'Royal Dates',
    tagline: 'King of Dates — Melt-In-Mouth Pulpy Caramel Sweetness',
    description: 'Extra-large succulent Medjool dates grown in sunny desert palm oases. Fleshy, soft, with natural hints of brown sugar, honey, and vanilla with zero added glucose.',
    longDescription: 'Often called "Nature’s Caramel," Medjool dates are the largest and most prized variety of date palm. Plump and moist, they are an incredible natural pre-workout booster, healthy dessert substitute, and sacred festive treat.',
    origin: 'Al-Qassim, Saudi Arabia',
    gradeDescription: 'Jumbo Medjool, naturally moist, 0% added sugar or syrup.',
    image: CLOUDINARY_URLS.prod_dates,
    gallery: [CLOUDINARY_URLS.prod_dates],
    rating: 4.97,
    reviewCount: 468,
    badge: 'Fresh Stock',
    priority: 85,
    active: true,
    healthBenefits: [
      'Instant sustainable endurance & energy',
      'High natural potassium (more than bananas)',
      'Aids healthy digestion through soluble fiber',
      'Pure guilt-free natural sweetener'
    ],
    nutritionalHighlights: {
      calories: '277 kcal / 100g',
      protein: '1.8g',
      fiber: '6.7g',
      healthyFats: '0.2g',
      keyNutrient: 'Natural Minerals & Energy'
    },
    types: [
      {
        type: 'Natural Whole',
        description: 'Plump whole royal Medjool dates with soft, velvety pulp.',
        image: CLOUDINARY_URLS.prod_dates,
        prices: makePriceTier(1450, 1.0)
      }
    ]
  },
  {
    grade: 'Mamra Extra',
    name: 'Authentic Kashmiri Mamra Badam',
    category: 'almonds',
    categoryLabel: 'Premium Almonds',
    tagline: '100% Original Kashmiri Mountain Mamra — Oil-Rich Brain Superfood',
    description: 'The undisputed royalty among almonds. Cultivated organically in the mountain valleys of Kashmir, Mamra badam contains up to 50% natural almond oil with unmatched memory and cognitive benefits.',
    origin: 'Kashmir Valley, India',
    image: CLOUDINARY_URLS.almonds_mamra,
    rating: 4.98,
    reviewCount: 512,
    badge: '100% Oil-Rich',
    priority: 80,
    active: true,
    healthBenefits: ['Memory and cognitive enhancer', 'High natural almond oil', 'Vitamin E powerhouse'],
    types: [{ type: 'Raw', description: 'Raw mountain Mamra', image: CLOUDINARY_URLS.almonds_mamra, prices: makePriceTier(2400, 1.0) }]
  },
  {
    grade: 'Snow White Halves',
    name: 'Kashmiri Snow White Akhrot Giri (Walnuts)',
    category: 'walnuts',
    categoryLabel: 'Snow White Walnuts',
    tagline: 'Extra Light Halves — Pure Pahadi Akhrot with Zero Bitterness',
    description: 'Finest hand-cracked walnut kernels from high-altitude Himalayan orchards in Kashmir. Pale ivory color, succulent crunch, and rich buttery sweetness without any harsh aftertaste.',
    origin: 'Anantnag & Shopian, Kashmir, India',
    image: CLOUDINARY_URLS.walnuts_kashmiri,
    rating: 4.96,
    reviewCount: 429,
    badge: 'Snow White Halves',
    priority: 75,
    active: true,
    healthBenefits: ['Rich in plant Omega-3 ALA', 'Optimal brain and heart food', 'Zero bitter tannin'],
    types: [{ type: 'Raw Halves', description: 'Hand-cracked butterfly halves', image: CLOUDINARY_URLS.walnuts_kashmiri, prices: makePriceTier(1420, 1.0) }]
  },
  {
    grade: 'Chilean Extra Light',
    name: 'Chilean Extra Light Walnut Kernels',
    category: 'walnuts',
    categoryLabel: 'Snow White Walnuts',
    tagline: 'Imported Southern Harvest — Plump Buttery Halves',
    description: 'Imported from Chile’s fertile valleys watered by Andean snowmelt. Renowned for their luminous light color, generous size, and mild taste.',
    origin: 'Central Valley, Chile',
    image: CLOUDINARY_URLS.walnuts_chilean,
    rating: 4.87,
    reviewCount: 176,
    badge: 'Fresh Andean Crop',
    priority: 70,
    active: true,
    healthBenefits: ['Cardiovascular health', 'Polyphenol antioxidants'],
    types: [{ type: 'Raw Halves', description: 'Extra light Chilean halves', image: CLOUDINARY_URLS.walnuts_chilean, prices: makePriceTier(1240, 1.0) }]
  },
  {
    grade: 'W240',
    name: 'W240 Royal Large Cashews',
    category: 'cashews',
    categoryLabel: 'Artisanal Cashews',
    tagline: 'Large Premium Standard — Ideal Crunch & Balanced Sweetness',
    description: 'A customer-favorite grade offering substantial kernel size, crisp bite, and creamy finish. Directly sourced from coastal Karnataka plantations.',
    origin: 'Mangalore & Karwar, Karnataka',
    image: CLOUDINARY_URLS.cashews_w240,
    rating: 4.88,
    reviewCount: 247,
    badge: 'Popular Choice',
    priority: 65,
    active: true,
    healthBenefits: ['Iron and copper', 'Natural immune support'],
    types: [{ type: 'Raw', description: 'Sun-dried raw whole cashews', image: CLOUDINARY_URLS.cashews_w240, prices: makePriceTier(980, 1.0) }]
  },
  {
    grade: 'W320',
    name: 'W320 Classic Whole Cashews',
    category: 'cashews',
    categoryLabel: 'Artisanal Cashews',
    tagline: 'The World Benchmark Grade — Everyday Gourmet Crunch',
    description: 'The most popular whole cashew grade across the globe. Perfectly balanced in size, sweetness, and crunch for daily snacking, curries, and sweets.',
    origin: 'Goa Coastal Belt, India',
    image: CLOUDINARY_URLS.cashews_w320,
    rating: 4.85,
    reviewCount: 198,
    badge: 'Daily Favorite',
    priority: 60,
    active: true,
    healthBenefits: ['Muscle recovery', 'Everyday stamina'],
    types: [{ type: 'Raw', description: 'Everyday gourmet table cashews', image: CLOUDINARY_URLS.cashews_w320, prices: makePriceTier(820, 1.0) }]
  },
  {
    grade: 'Emerald Kernels',
    name: 'California Emerald Raw Pistachio Kernels (Unsalted)',
    category: 'pistachios',
    categoryLabel: 'Gourmet Pistachios',
    tagline: '100% Shell-Free Jade Kernels — For Sweets, Baking & Gourmet Diets',
    description: 'Pure, raw, shell-free green pistachio kernels. Vivid jade green color, sweet aroma, and zero added sodium. Ideal for barfi, kulfi, baklava, and pesto.',
    origin: 'California, United States',
    image: CLOUDINARY_URLS.pistachios_emerald,
    rating: 4.91,
    reviewCount: 167,
    badge: '100% Shell Free',
    priority: 55,
    active: true,
    healthBenefits: ['Zero sodium', 'High potassium and protein'],
    types: [{ type: 'Raw Kernels', description: 'Shell-free emerald kernels', image: CLOUDINARY_URLS.pistachios_emerald, prices: makePriceTier(2100, 1.0) }]
  },
  {
    grade: 'Afghan Jumbo',
    name: 'Afghan Royal Sun-Dried Anjeer (Figs)',
    category: 'figs',
    categoryLabel: 'Sun-Dried Figs',
    tagline: 'Naturally Sweet Mountain Garland — High Calcium & Digestive Elixir',
    description: 'Sun-dried in the high valleys of Kandahar, Afghanistan. Strung in traditional garlands, these jumbo figs have a golden chewy skin, honeycomb seeds, and a soft honeyed interior.',
    origin: 'Kandahar, Afghanistan',
    image: CLOUDINARY_URLS.figs_afghan,
    rating: 4.94,
    reviewCount: 289,
    badge: 'High Fiber Superfood',
    priority: 50,
    active: true,
    healthBenefits: ['Highest plant calcium in dried fruit', 'Aids healthy digestion', 'Iron replenishment'],
    types: [{ type: 'Whole Dried Figs', description: 'Garland strung whole dried anjeer', image: CLOUDINARY_URLS.figs_afghan, prices: makePriceTier(1680, 1.0) }]
  },
  {
    grade: 'Long Green Jumbo',
    name: 'Afghani Long Green Seedless Raisins (Kishmish)',
    category: 'raisins',
    categoryLabel: 'Sundried Raisins',
    tagline: 'Naturally Slender & Sweet — Sun-Drying Heritage of Herat',
    description: 'Slender, elongated pale green seedless raisins dried naturally in shade houses (kishmish khana). Tender, sweet, and bursting with refreshing natural grape sugars.',
    origin: 'Herat, Afghanistan',
    image: CLOUDINARY_URLS.raisins_green,
    rating: 4.88,
    reviewCount: 215,
    badge: 'Naturally Shade-Dried',
    priority: 45,
    active: true,
    healthBenefits: ['Natural stamina and iron', 'Zero added sulphur or artificial glaze'],
    types: [{ type: 'Naturally Sweet', description: 'Long green seedless raisins', image: CLOUDINARY_URLS.raisins_green, prices: makePriceTier(680, 1.0) }]
  },
  {
    grade: 'Roasted Crunch',
    name: 'Roasted 7-in-1 Super Seeds & Berry Crunch',
    category: 'berries-seeds',
    categoryLabel: 'Super Seeds & Berries',
    tagline: 'Pumpkin, Sunflower, Chia, Flax, Watermelon, Cranberry & Blueberry Mix',
    description: 'A delicious daily powerhouse mix of 5 slow-roasted crispy seeds and 2 antioxidant-packed wild berries lightly seasoned with Himalayan rock salt.',
    origin: 'Bangalore Roastery, India',
    image: CLOUDINARY_URLS.seeds_7in1,
    rating: 4.92,
    reviewCount: 374,
    badge: 'Keto & Fitness Crunch',
    priority: 40,
    active: true,
    healthBenefits: ['Rich in plant zinc and magnesium', 'High protein keto snack', 'Antioxidant rich'],
    types: [{ type: 'Roasted & Lightly Salted', description: '7-in-1 superfood trail mix', image: CLOUDINARY_URLS.seeds_7in1, prices: makePriceTier(790, 1.0) }]
  },
  {
    grade: 'Imperial Keepsake',
    name: 'The Imperial Grandeur Royal Dry Fruit Hamper',
    category: 'gift-boxes',
    categoryLabel: 'Festive Hampers',
    tagline: 'Handcrafted Wooden Keepsake Chest with 4 Premium Calibers',
    description: 'An opulent royal gift chest featuring 4 individual air-sealed compartments with California Nonpareil Almonds, W180 King Cashews, Kashmiri Snow White Walnuts, and Roasted Afghani Pistachios.',
    origin: 'Handcrafted in Karnataka, India',
    image: CLOUDINARY_URLS.gift_imperial,
    rating: 4.99,
    reviewCount: 182,
    badge: 'Royal Keepsake Box',
    priority: 35,
    active: true,
    healthBenefits: ['The pinnacle of wedding and festive gifting', 'Reusable heirloom wooden chest'],
    types: [
      {
        type: '1kg Gift Chest (4x250g)',
        description: 'Contains 250g each of Almonds, Cashews, Walnuts, and Pistachios',
        image: CLOUDINARY_URLS.gift_imperial,
        prices: [{ quantity: '1kg', price: 1950 }]
      },
      {
        type: '2kg Royal Chest (4x500g)',
        description: 'Contains 500g each of Almonds, Cashews, Walnuts, and Pistachios',
        image: CLOUDINARY_URLS.gift_imperial,
        prices: [{ quantity: '2kg', price: 3650 }]
      }
    ]
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is required for seeding.');
    process.exit(1);
  }

  let connected = false;
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Successfully connected to MongoDB!');
    connected = true;
  } catch (e) {
    console.warn('Connection failed:', e.message);
  }

  if (!connected) {
    console.error('Could not connect to any MongoDB cluster.');
    process.exit(1);
  }

  const db = mongoose.connection.db;
  const productsCol = db.collection('products');

  console.log('Clearing existing products in MongoDB...');
  await productsCol.deleteMany({});

  console.log(`Inserting ${MOCK_PRODUCTS.length} curated dry fruit products with Cloudinary images...`);
  const result = await productsCol.insertMany(MOCK_PRODUCTS);
  console.log(`Successfully inserted ${result.insertedCount} products into MongoDB!`);

  // Also seed SiteContent with updated branding and Cloudinary banners
  const siteContentCol = db.collection('sitecontents');
  const siteContentDoc = {
    hero: {
      badge: 'Direct from Kashmir, Goa & California Orchards',
      titleLine1: 'Goodness',
      titleLine2: 'in Every',
      titleHighlight: 'Bite',
      subtitle: 'Explore our handpicked dry fruits, nuts and wholesome delights with free pan-India doorstep delivery.',
      buttonText: 'Shop All Dry Fruits',
      image: CLOUDINARY_URLS.hero_bowls
    },
    heroSlides: [
      {
        id: 'slide-main',
        badge: 'PREMIUM DRY FRUITS STORE',
        titleLine1: 'Goodness',
        titleLine2: 'in Every',
        titleHighlight: 'Bite',
        subtitle: 'Explore our handpicked dry fruits, nuts and wholesome delights.',
        buttonText: 'Shop All Dry Fruits',
        image: CLOUDINARY_URLS.hero_bowls
      }
    ],
    announcement: 'Free pan-India shipping on orders over ₹1,200 | 100% Natural & Premium Quality',
    contact: {
      phone: '+91 94812 73941',
      email: 'krishadryfruits7@gmail.com',
      address: 'Shop No. 12, Ground Floor, Market Road, Yeshwanthpur, Bengaluru, Karnataka 560022',
      timings: 'Mon - Sun: 9:00 AM - 9:30 PM'
    },
    updatedAt: new Date()
  };

  await siteContentCol.deleteMany({});
  await siteContentCol.insertOne(siteContentDoc);
  console.log('Successfully updated site content in MongoDB with Cloudinary banner!');

  await mongoose.connection.close();
  console.log('Database seeding complete!');
}

seed();
