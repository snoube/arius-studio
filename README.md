# Arius Studio

Application d'aide à la création d'images pour le serveur Minecraft **Arius**.
Première catégorie disponible : **Créateur d'image**.

## Lancer l'application

**Sans rien installer** : double-clique sur `index.html`. Il s'ouvre dans Chrome, Edge ou Firefox.

**En application de bureau (Electron)** : il faut [Node.js](https://nodejs.org). Dans ce dossier, lance :

```
npm install
npm start
```

## Sur téléphone (Samsung S21, Android, iPhone, tablette)

L'application change toute seule de disposition sur un petit écran : rien à régler.

- **Portrait** : l'image en haut, la barre d'outils en bas. Toucher un outil ouvre ses réglages dans un panneau qui monte depuis le bas.
- **Paysage** : les outils à gauche, l'image au centre, les réglages à droite.
- Le bouton **Calques** (en bas à droite) ouvre les calques et les propriétés, avec deux onglets.
- La **poignée** du panneau : la glisser vers le haut l'agrandit, vers le bas le réduit puis le ferme.
- Le geste ou le bouton **retour** d'Android ferme le panneau sans quitter l'application.

### Gestes

| Geste | Action |
|---|---|
| Un doigt sur un calque | Le sélectionner et le déplacer |
| Un doigt sur le fond ou hors de l'image | Se déplacer dans la zone de travail |
| Deux doigts : pincer / écarter | Dézoomer / zoomer |
| Deux doigts : glisser | Se déplacer |
| Bouton ⛶ en haut | Ajuster l'image à l'écran |

### L'ouvrir sur le téléphone

Sur Android, ouvrir `index.html` directement depuis les fichiers du téléphone est souvent bloqué par le navigateur.
Il faut que l'application soit servie par une adresse web :

1. **La mettre en ligne (conseillé)** : par exemple avec GitHub Pages, Netlify ou le site du serveur Arius.
   Ce sont des fichiers simples, sans serveur à programmer : il suffit de déposer le dossier.
   Ouvre ensuite l'adresse dans Chrome ou Samsung Internet, puis menu ⋮ > **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
   Elle s'ouvre alors en plein écran comme une vraie application et fonctionne **même sans connexion**.
2. **Test rapide sur le même Wi-Fi** : sur le PC, dans ce dossier, lance `npx serve` puis ouvre sur le téléphone
   l'adresse `http://<adresse IP du PC>:3000`. Tout fonctionne, sauf l'installation et le mode hors ligne (il faut une adresse en `https`).

Bon à savoir :

- La sauvegarde automatique est propre à chaque appareil. Pour passer un projet du PC au téléphone, utilise Fichier > Enregistrer puis Fichier > Ouvrir.
- À l'export, le bouton **Partager** (quand le téléphone le propose) envoie l'image directement vers Discord, la galerie, Drive…
- Après une mise à jour des fichiers en ligne, change `VERSION` dans `sw.js` pour que les téléphones récupèrent la nouvelle version.

## Les outils (touches 1 à 8)

1. **Fond** : fond principal (sa taille = taille de l'image) et fonds secondaires.
2. **Bordure** : dessinée à l'intérieur de la forme, sans changer sa taille. Elle suit les angles.
3. **Angles** : encoche, biseau, arrondi, arrondi inversé, escalier, profil pixel (grille cliquable). Sur un coin ou sur les quatre.
4. **Effets** : reflet, dégradé sombre ou clair, métallisé, scintillant.
5. **Motifs** : rayures, carrés (quadrillage, damier, plaques rivetées), destruction. Ils peuvent s'ajouter à un effet.
6. **Texte** : styles de police enregistrables, police Minecraft (Monocraft), import de polices `.ttf`, `.otf` ou `.woff`.
7. **Éléments** : ligne, carré, rond, point, triangle, losange.
8. **Ombre** : au-dessus, en dessous ou les deux, avec distance, flou, couleur et opacité. Pas sur le fond principal.

Chaque outil a ses **préréglages** : bouton « Enregistrer », puis choix dans la liste.
Le menu **Fichier** permet de les exporter ou de les importer en JSON.

## Raccourcis

| Touche | Action |
|---|---|
| 1 à 8 | Changer d'outil |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| Ctrl+C / Ctrl+V | Copier / coller un calque (ou coller une image) |
| Ctrl+D | Dupliquer le calque |
| Suppr | Supprimer le calque |
| Flèches (Maj = ×10) | Déplacer le calque |
| + / - / 0 | Zoomer / dézoomer / ajuster à l'écran |
| Espace + glisser, ou clic molette | Se déplacer dans la zone de travail |
| Ctrl+S / Ctrl+O / Ctrl+E | Enregistrer / ouvrir un projet / exporter |

Pour renommer un calque : double-clic sur son nom, ou le bouton crayon au-dessus de la liste.

## Export

Formats proposés : PNG, WebP et JPEG.

- **PNG et WebP** gardent les zones vides **transparentes** : angles découpés, fonds à 0 %.
- **JPEG** ne gère pas la transparence. Ces zones sont remplies avec la couleur de fond choisie.
- L'option **Agrandissement** (×1 à ×16) agrandit l'image sans flou.

Le travail est sauvegardé automatiquement dans le navigateur.
Pour garder un projet en fichier, utilise Fichier > Enregistrer (`.arius.json`).

## Organisation du code

```
index.html            page principale
main.js, package.json lanceur Electron
manifest.webmanifest  fiche de l'application installable (nom, icônes)
sw.js                 mode hors ligne (quand l'application est en ligne)
css/                  un fichier par zone (couleurs, mise en page, champs, panneaux…)
css/mobile.css        disposition téléphone (tout est sous la classe .m)
js/core/              état du document, historique, préréglages, stockage
js/render/            dessin : formes et angles, effets, motifs, calques
js/fonts/             polices (Monocraft intégrée)
js/tools/             un fichier par outil
js/ui/                un fichier par partie de l'interface (mobile.js : panneau du téléphone)
assets/               logo, icônes de l'application, licence de la police
```

Pour ajouter un outil : crée `js/tools/tool-xxx.js` sur le modèle des autres, puis ajoute-le dans `index.html`.
L'ordre des scripts donne l'ordre dans la barre.

## Licence de la police

Monocraft, par IdreesInc, sous licence SIL Open Font License 1.1 : voir `assets/fonts/LICENSE-Monocraft.txt`.
C'est une police très proche de celle de Minecraft, mais pas la police officielle.
