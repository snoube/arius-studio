/*
 * Arius Studio - espace de noms global.
 * Chaque fichier ajoute son module dans une de ces branches.
 * (Pas de modules ES pour que l'application fonctionne aussi en ouvrant index.html directement.)
 */
window.Arius = window.Arius || {
  core: {},    // état, événements, stockage, historique
  render: {},  // dessin des calques (géométrie, effets, motifs)
  ui: {},      // interface (panneaux, champs, dialogues)
  tools: {},   // les 8 outils du créateur d'image
  fonts: {}    // polices
};
