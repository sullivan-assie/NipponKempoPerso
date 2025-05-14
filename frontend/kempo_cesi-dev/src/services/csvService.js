//import Papa from 'papaparse';

/**
 * Lit et parse un fichier CSV en retournant une promesse avec les données.
 * @param {File} file - Le fichier CSV à parser.
 * @returns {Promise<Array<Object>>} - La promesse qui résout avec le tableau d'objets.
 */

export async function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');
        
        // Vérifier si le fichier a des en-têtes
        if (lines.length === 0) {
          return resolve([]);
        }
        
        // Déterminer le délimiteur (virgule, point-virgule, tabulation)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes('\t')) delimiter = '\t';
        
        // Extraire les en-têtes
        const headers = lines[0].split(delimiter).map(header => 
          header.trim().replace(/^"|"$/g, '') // Enlever les guillemets si présents
        );
        
        // Traiter les données
        const result = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue; // Ignorer les lignes vides
          
          const values = lines[i].split(delimiter).map(value => 
            value.trim().replace(/^"|"$/g, '') // Enlever les guillemets si présents
          );
          
          if (values.length !== headers.length) {
            console.warn(`Ligne ${i + 1}: Le nombre de valeurs (${values.length}) ne correspond pas au nombre d'en-têtes (${headers.length})`);
            continue; // Ignorer cette ligne
          }
          
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          
          result.push(row);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}
