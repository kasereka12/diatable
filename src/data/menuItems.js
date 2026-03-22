// Demo menu data per restaurant id
export const MENUS = {
  1: {
    categories: [
      {
        name: 'Plats Principaux',
        icon: '🍽️',
        items: [
          { id: 1, name: 'Thiéboudienne au Poisson', desc: 'Riz tomate au poisson braisé, légumes du jardin', price: '85', popular: true },
          { id: 2, name: 'Thiébou Yapp', desc: 'Riz tomate à la viande de bœuf mijotée', price: '90', popular: false },
          { id: 3, name: 'Mafé', desc: 'Ragoût à la pâte d\'arachide, riz blanc', price: '80', popular: true },
          { id: 4, name: 'Yassa Poulet', desc: 'Poulet mariné à l\'oignon et citron, riz blanc', price: '75', popular: false },
        ],
      },
      {
        name: 'Entrées',
        icon: '🥗',
        items: [
          { id: 5, name: 'Salade Sénégalaise', desc: 'Tomates, oignons, avocat, vinaigrette citron', price: '35', popular: false },
          { id: 6, name: 'Accara', desc: 'Beignets de niébé frits, sauce tartare maison', price: '30', popular: true },
        ],
      },
      {
        name: 'Boissons',
        icon: '🥤',
        items: [
          { id: 7, name: 'Bissap Frais', desc: 'Jus d\'hibiscus fait maison, glacé', price: '25', popular: true },
          { id: 8, name: 'Ginger Beer', desc: 'Boisson gingembre artisanale', price: '25', popular: false },
          { id: 9, name: 'Eau Minérale', desc: '', price: '10', popular: false },
        ],
      },
    ],
  },
  2: {
    categories: [
      {
        name: 'Dim Sum',
        icon: '🥟',
        items: [
          { id: 1, name: 'Har Gow', desc: 'Raviolis crevettes vapeur (4 pièces)', price: '55', popular: true },
          { id: 2, name: 'Siu Mai', desc: 'Raviolis porc & crevette ouverts (4 pièces)', price: '50', popular: true },
          { id: 3, name: 'Cheung Fun', desc: 'Rouleaux de riz vapeur aux crevettes', price: '60', popular: false },
        ],
      },
      {
        name: 'Plats Principaux',
        icon: '🍜',
        items: [
          { id: 4, name: 'Riz Cantonais', desc: 'Riz sauté aux œufs, petits pois, jambon', price: '70', popular: false },
          { id: 5, name: 'Nouilles Wok', desc: 'Nouilles sautées bœuf, poivrons, sauce huître', price: '80', popular: true },
          { id: 6, name: 'Canard Laqué', desc: 'Demi-canard, crêpes, sauce hoisin', price: '150', popular: false },
        ],
      },
      {
        name: 'Desserts',
        icon: '🍮',
        items: [
          { id: 7, name: 'Egg Tart', desc: 'Tartelette crème aux œufs (2 pièces)', price: '30', popular: true },
          { id: 8, name: 'Sesame Ball', desc: 'Beignets sésame, pâte haricot rouge (3 pièces)', price: '35', popular: false },
        ],
      },
    ],
  },
}

// Fallback generic menu for restaurants without specific menu
export const DEFAULT_MENU = {
  categories: [
    {
      name: 'Plats Principaux',
      icon: '🍽️',
      items: [
        { id: 1, name: 'Plat du Jour', desc: 'Demandez notre spécialité du moment', price: '75', popular: true },
        { id: 2, name: 'Plat Végétarien', desc: 'Sélection végétarienne authentique', price: '65', popular: false },
        { id: 3, name: 'Spécialité Maison', desc: 'La fierté du chef, recette familiale', price: '90', popular: true },
      ],
    },
    {
      name: 'Boissons',
      icon: '🥤',
      items: [
        { id: 4, name: 'Boisson du Pays', desc: 'Boisson traditionnelle maison', price: '25', popular: true },
        { id: 5, name: 'Eau Minérale', desc: '', price: '10', popular: false },
      ],
    },
  ],
}

export const REVIEWS = [
  { id: 1, name: 'Aminata S.', initials: 'AS', rating: 5, date: 'Mars 2026', text: 'Exactement comme chez ma mère à Dakar. Le thiéboudienne est parfait, les saveurs sont authentiques. Je reviendrai chaque semaine !' },
  { id: 2, name: 'Thomas B.', initials: 'TB', rating: 4, date: 'Fév 2026', text: 'Très bonne découverte ! La cuisine est généreuse et le cadre chaleureux. Le bissap maison est délicieux.' },
  { id: 3, name: 'Fatima E.', initials: 'FE', rating: 5, date: 'Janv 2026', text: 'Le meilleur restaurant sénégalais de Casablanca sans aucun doute. Service attentionné et prix raisonnables.' },
]
