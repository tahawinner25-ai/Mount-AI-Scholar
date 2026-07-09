import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';

const DIST_DIR = path.join(process.cwd(), 'dist');
const OUT_FILE = path.join(process.cwd(), 'mount-ai-scholar-chrome-extension.zip');

console.log('📦 Début du packaging de l\'extension Chrome...');

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Le dossier /dist n\'existe pas. Lance d\'abord "npm run build".');
  process.exit(1);
}

// Un zippeur de fichiers récursif basique et ultra-robuste en Node.js pur sans dépendance
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

try {
  // On récupère la liste de tous les fichiers du dossier dist
  const allFiles = getFiles(DIST_DIR);
  
  // Utilisons le module natif de compression de node pour empaqueter
  // On va utiliser un format de compression ou expliquer comment l'utilisateur peut le faire,
  // ou encore mieux : nous écrivons un mini-générateur de zip en binaire pur ou en utilisant zlib.
  // Pour faire un vrai format ZIP en JS pur sans dépendance, c'est possible mais complexe à coder de zéro.
  // Pour rester hyper propre et sans bug, nous pouvons proposer un script simple ou utiliser une commande système si disponible.
  // Mais la meilleure approche consiste à utiliser une bibliothèque de packaging légère ou à donner la méthode standard de l'OS,
  // ou d'écrire un script utilisant un utilitaire natif (tar/zip).
  // En fait, sous Windows (CMD de l'utilisateur), la commande PowerShell pour compresser un dossier est :
  // Compress-Archive -Path dist/* -DestinationPath mount-ai-scholar-chrome-extension.zip -Force
  // C'est intégré à 100% sous Windows sans installer quoi que ce soit !
  // Sous Mac/Linux, la commande est : zip -r mount-ai-scholar-chrome-extension.zip dist/*
  // Faisons un script Node multi-plateforme qui exécute la commande native appropriée de l'OS !
  
  if (process.platform === 'win32') {
    console.log('💻 Détection de Windows. Utilisation de PowerShell Compress-Archive...');
    execSync('powershell -Command "Compress-Archive -Path dist/* -DestinationPath mount-ai-scholar-chrome-extension.zip -Force"', { stdio: 'inherit' });
  } else {
    console.log('🍎/🐧 Détection de macOS/Linux. Utilisation de la commande zip...');
    execSync('zip -r mount-ai-scholar-chrome-extension.zip dist/*', { stdio: 'inherit' });
  }
  
  console.log('✅ Extension Chrome packagée avec succès sous : mount-ai-scholar-chrome-extension.zip !');
} catch (error) {
  console.error('❌ Erreur lors du packaging de l\'extension :', error.message);
  process.exit(1);
}
