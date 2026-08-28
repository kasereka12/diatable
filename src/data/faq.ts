// Shared FAQ content — used by the /aide page and the chat widget so the
// answers only ever live in one place.

export interface FaqEntry { q: string; a: string }

export const FAQ_CATEGORIES = [
  { id: 'commander', label: 'Commander' },
  { id: 'vendeurs',  label: 'Vendeurs' },
  { id: 'paiement',  label: 'Paiement' },
  { id: 'compte',    label: 'Mon compte' },
] as const

export const FAQS: Record<string, FaqEntry[]> = {
  commander: [
    { q: 'Comment trouver un restaurant ou un cuisinier ?', a: 'Utilisez la page Restaurants pour filtrer par cuisine, ville ou note. Vous pouvez aussi passer par la page Cuisines pour naviguer par pays.' },
    { q: 'Comment contacter un vendeur ?', a: 'Sur la fiche de chaque restaurant, vous trouverez le numéro de téléphone, WhatsApp et un formulaire de contact. Les vendeurs répondent généralement sous 2h.' },
    { q: 'Les commandes sont-elles livrées à domicile ?', a: 'Cela dépend du vendeur. Certains proposent la livraison, d\'autres uniquement le retrait sur place ou la réservation de table. Les options disponibles sont indiquées sur chaque fiche.' },
    { q: 'Puis-je annuler une commande ?', a: 'L\'annulation se fait directement avec le vendeur. Contactez-le dès que possible via WhatsApp ou téléphone. DiaTable n\'intervient pas dans la gestion des commandes.' },
    { q: 'Comment laisser un avis ?', a: 'Après votre commande, rendez-vous sur la fiche du restaurant et cliquez sur "Laisser un avis". Vous devez être connecté à votre compte.' },
  ],
  vendeurs: [
    { q: 'Comment devenir vendeur sur DiaTable ?', a: 'Cliquez sur "Devenir vendeur" depuis le menu ou votre profil. Remplissez le formulaire en 5 étapes (type de cuisine, coordonnées, photos, menu). Votre profil est examiné sous 48h.' },
    { q: 'Est-ce gratuit de s\'inscrire ?', a: 'Oui, l\'inscription est entièrement gratuite. De plus, DiaTable ne prend aucune commission pendant vos 3 premiers mois d\'activité.' },
    { q: 'Combien de temps pour être validé ?', a: 'Notre équipe examine les nouveaux profils sous 24 à 48h en jours ouvrés. Vous recevez un email de confirmation une fois validé.' },
    { q: 'Comment gérer mon menu ?', a: 'Depuis votre tableau de bord vendeur, section "Menu", vous pouvez ajouter, modifier ou supprimer des plats à tout moment.' },
    { q: 'Puis-je vendre depuis mon domicile ?', a: 'Absolument. DiaTable accueille les cuisiniers à domicile, les traiteurs et les pop-ups, pas seulement les restaurants.' },
  ],
  paiement: [
    { q: 'Quels modes de paiement sont acceptés ?', a: 'Le règlement se fait directement avec le vendeur : espèces, virement ou paiement mobile selon ce que propose chaque vendeur. Les options sont indiquées sur leur fiche.' },
    { q: 'DiaTable prend-il des commissions ?', a: 'Aucune commission pendant les 3 premiers mois. Après cette période, un faible pourcentage est prélevé uniquement sur les paiements en ligne (si activés).' },
    { q: 'Y a-t-il des frais d\'abonnement ?', a: 'Non. L\'inscription et la publication de votre profil sont gratuites. Des options premium (mise en avant, publicité) seront disponibles prochainement.' },
  ],
  compte: [
    { q: 'Comment créer un compte ?', a: 'Cliquez sur "S\'inscrire" dans la barre de navigation. Choisissez votre rôle (client ou vendeur), entrez votre email et créez votre mot de passe. Vous pouvez aussi vous connecter avec Google.' },
    { q: 'J\'ai oublié mon mot de passe.', a: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Vous recevrez un lien de réinitialisation par email dans quelques minutes.' },
    { q: 'Comment modifier mes informations personnelles ?', a: 'Rendez-vous dans "Mon profil" (icône utilisateur en haut à droite), onglet "Paramètres". Vous pouvez y modifier votre nom, photo et coordonnées.' },
    { q: 'Comment supprimer mon compte ?', a: 'Contactez-nous à hello@datable.ma avec la demande de suppression. Votre compte sera supprimé sous 72h conformément au RGPD.' },
  ],
}
