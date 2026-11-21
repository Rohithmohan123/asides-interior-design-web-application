// SAMPLE CONTENT — every project, client brief and location detail below is fictional.
// It exists only to demonstrate the application. None of it is real ASIDES.in work.

export const categories = [
  { slug: 'living-rooms', name: 'Living Rooms', description: 'Comfortable, light-filled living and family spaces.', sort_order: 1 },
  { slug: 'kitchens', name: 'Kitchens', description: 'Modular and custom kitchens planned around how you cook.', sort_order: 2 },
  { slug: 'bedrooms', name: 'Bedrooms', description: 'Calm bedrooms with built-in storage and layered lighting.', sort_order: 3 },
  { slug: 'bathrooms', name: 'Bathrooms', description: 'Practical wet areas with durable, easy-care finishes.', sort_order: 4 },
  { slug: 'workspaces', name: 'Workspaces', description: 'Home offices and small studios designed for focus.', sort_order: 5 },
  { slug: 'commercial', name: 'Commercial', description: 'Cafés, boutiques and reception areas.', sort_order: 6 }
];

const img = (slug) => `/images/projects/${slug}.svg`;
const gal = (slug) => [img(slug), `/images/projects/${slug}-detail-1.svg`, `/images/projects/${slug}-detail-2.svg`];

export const projects = [
  {
    slug: 'teak-and-linen-living-room', title: 'Teak & Linen Living Room', category: 'living-rooms',
    location: 'Kakkanad, Kochi', area_sqft: 420, year: 2024, style: 'Contemporary Kerala',
    summary: 'A warm family living room that pairs reclaimed teak with soft linen upholstery.',
    description: 'The brief was a living room that stays cool through the monsoon months and works for both quiet evenings and family gatherings. Low teak seating, a jute rug and linen drapes keep the palette natural, while a slatted partition separates the entrance without blocking cross-ventilation.',
    highlights: ['Slatted teak partition that keeps air moving', 'Concealed storage under the window bench', 'Three-layer lighting: cove, task and accent'],
    materials: ['Reclaimed teak', 'Linen', 'Jute', 'Lime plaster'], featured: 1
  },
  {
    slug: 'terracotta-courtyard-lounge', title: 'Terracotta Courtyard Lounge', category: 'living-rooms',
    location: 'Thrissur', area_sqft: 560, year: 2023, style: 'Tropical Modern',
    summary: 'An open lounge arranged around a skylit courtyard with terracotta floors.',
    description: 'A traditional nadumuttam layout updated for modern living. Terracotta tiles, a planted courtyard and cane furniture make the space feel open, while built-in display niches hold the family’s brass collection.',
    highlights: ['Skylit courtyard with drainage-friendly planting', 'Built-in display niches', 'Cane and rosewood furniture'],
    materials: ['Terracotta tile', 'Cane', 'Rosewood', 'Brass'], featured: 0
  },
  {
    slug: 'sage-modular-kitchen', title: 'Sage Modular Kitchen', category: 'kitchens',
    location: 'Edappally, Kochi', area_sqft: 180, year: 2024, style: 'Minimal',
    summary: 'An L-shaped modular kitchen in sage green with a quartz breakfast counter.',
    description: 'Planned around the work triangle with a tall pantry unit, a dedicated spice pull-out and a quartz breakfast counter that doubles as a prep surface. Matte sage shutters with brushed-brass handles keep the look calm.',
    highlights: ['Tall pantry with pull-out baskets', 'Quartz breakfast counter', 'Under-cabinet LED task lighting'],
    materials: ['Marine plywood', 'Matte laminate', 'Quartz', 'Brushed brass'], featured: 1
  },
  {
    slug: 'charcoal-island-kitchen', title: 'Charcoal Island Kitchen', category: 'kitchens',
    location: 'Whitefield, Bengaluru', area_sqft: 240, year: 2023, style: 'Industrial',
    summary: 'A charcoal-and-oak kitchen with a central island and open shelving.',
    description: 'Designed for a couple who cook together. The island holds the hob and seats three; open oak shelves keep daily-use items within reach, and a separate utility nook hides the washing machine.',
    highlights: ['Central island with induction hob', 'Separate utility nook', 'Open oak shelving'],
    materials: ['Oak veneer', 'Charcoal lacquer', 'Granite', 'Black steel'], featured: 0
  },
  {
    slug: 'indigo-master-bedroom', title: 'Indigo Master Bedroom', category: 'bedrooms',
    location: 'Kaloor, Kochi', area_sqft: 300, year: 2024, style: 'Contemporary',
    summary: 'A restful master bedroom with an indigo feature wall and full-height wardrobes.',
    description: 'An indigo wall behind an upholstered headboard anchors the room. Full-height sliding wardrobes free up floor space, and a reading corner by the window gets its own warm task lamp.',
    highlights: ['Full-height sliding wardrobes', 'Upholstered headboard wall', 'Reading corner with task lighting'],
    materials: ['Indigo lime wash', 'Walnut veneer', 'Cotton upholstery'], featured: 1
  },
  {
    slug: 'kids-loft-bedroom', title: 'Kids’ Loft Bedroom', category: 'bedrooms',
    location: 'Kottayam', area_sqft: 210, year: 2022, style: 'Playful',
    summary: 'A shared bedroom for two children with a loft bed, study desks and toy storage.',
    description: 'A loft bed frees the floor for play and two study desks. Rounded edges, washable paint and low open shelving make the room safe and easy for the children to keep tidy.',
    highlights: ['Loft bed with safety rails', 'Two study desks', 'Low open shelving'],
    materials: ['Birch plywood', 'Washable paint', 'Cork pinboard'], featured: 0
  },
  {
    slug: 'monsoon-spa-bathroom', title: 'Monsoon Spa Bathroom', category: 'bathrooms',
    location: 'Alappuzha', area_sqft: 90, year: 2023, style: 'Spa',
    summary: 'A compact bathroom with a walk-in shower, stone textures and anti-skid tiles.',
    description: 'A clear glass partition separates wet and dry zones. Anti-skid textured tiles, a wall-hung vanity and a niche for toiletries make cleaning easy in a humid climate.',
    highlights: ['Wet and dry zoning', 'Wall-hung vanity', 'Anti-skid textured tiles'],
    materials: ['Porcelain stone tile', 'Toughened glass', 'Teak-finish WPC'], featured: 0
  },
  {
    slug: 'quiet-corner-home-office', title: 'Quiet Corner Home Office', category: 'workspaces',
    location: 'Infopark, Kochi', area_sqft: 120, year: 2024, style: 'Scandinavian',
    summary: 'A compact home office with acoustic panels, a sit-stand desk and cable management.',
    description: 'A spare room turned into a video-call-ready office. Fabric acoustic panels soften echo, a sit-stand desk faces the window, and all cabling runs through a concealed channel.',
    highlights: ['Fabric acoustic panels', 'Sit-stand desk', 'Concealed cable channel'],
    materials: ['Ash plywood', 'Felt acoustic panels', 'Powder-coated steel'], featured: 1
  },
  {
    slug: 'filter-coffee-cafe', title: 'Filter Coffee Café', category: 'commercial',
    location: 'Fort Kochi', area_sqft: 850, year: 2023, style: 'Heritage Revival',
    summary: 'A 30-seat café that reuses heritage tiles and restored window frames.',
    description: 'Restored Athangudi-style tiles and wooden window frames set the character. The layout separates a quick-service counter from a quieter seating area, and durable finishes stand up to heavy daily use.',
    highlights: ['Separate takeaway and seating zones', 'Restored heritage windows', 'Durable, easy-clean finishes'],
    materials: ['Heritage cement tile', 'Restored wood', 'Brass fittings'], featured: 1
  },
  {
    slug: 'handloom-boutique', title: 'Handloom Boutique', category: 'commercial',
    location: 'MG Road, Kochi', area_sqft: 600, year: 2022, style: 'Craft Minimal',
    summary: 'A boutique for handloom textiles with modular display and a fitting lounge.',
    description: 'Modular wall rails let the shop re-merchandise each season without rebuilding. Warm, colour-accurate lighting shows the textiles at their best, and a small fitting lounge gives customers a place to sit.',
    highlights: ['Re-configurable wall rails', 'Colour-accurate lighting', 'Fitting lounge'],
    materials: ['Bamboo', 'Natural cotton', 'Powder-coated rails'], featured: 0
  }
].map((p) => ({ ...p, cover_image: img(p.slug), gallery: gal(p.slug), published: 1 }));
