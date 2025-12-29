/**
 * Service de détection de langue basé sur la géolocalisation
 * Détecte automatiquement la langue selon le pays de l'utilisateur
 */

// Mapping des codes pays ISO vers les langues
const countryToLanguage = {
  // Pays francophones d'Afrique de l'Ouest
  'ML': 'fr', // Mali
  'BF': 'fr', // Burkina Faso
  'SN': 'fr', // Sénégal
  'CI': 'fr', // Côte d'Ivoire
  'NE': 'fr', // Niger
  'TG': 'fr', // Togo
  'BJ': 'fr', // Bénin
  'GN': 'fr', // Guinée
  'MR': 'fr', // Mauritanie
  'CM': 'fr', // Cameroun
  'CD': 'fr', // RD Congo
  'CG': 'fr', // Congo
  'GA': 'fr', // Gabon
  'TD': 'fr', // Tchad
  'CF': 'fr', // Centrafrique
  'MG': 'fr', // Madagascar
  'RW': 'fr', // Rwanda
  'BI': 'fr', // Burundi
  'DJ': 'fr', // Djibouti
  'KM': 'fr', // Comores
  'FR': 'fr', // France
  'BE': 'fr', // Belgique
  'CH': 'fr', // Suisse
  'CA': 'fr', // Canada (Québec)
  'LU': 'fr', // Luxembourg
  'MC': 'fr', // Monaco
  
  // Pays anglophones (par défaut)
  // Tous les autres pays → anglais
};

/**
 * Détecte la langue basée sur la géolocalisation
 * @returns {Promise<string>} Code de langue ('fr' ou 'en')
 */
export const detectLanguageFromGeolocation = async () => {
  try {
    // Méthode 1: Utiliser l'API de géolocalisation IP (gratuite)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Geolocation API failed');
    }

    const data = await response.json();
    const countryCode = data.country_code;

    if (countryCode && countryToLanguage[countryCode]) {
      console.log(`🌍 Pays détecté: ${data.country_name} (${countryCode}) → Langue: ${countryToLanguage[countryCode]}`);
      return countryToLanguage[countryCode];
    }

    // Si le pays n'est pas dans la liste, utiliser anglais par défaut
    console.log(`🌍 Pays détecté: ${data.country_name} (${countryCode}) → Langue: en (par défaut)`);
    return 'en';
  } catch (error) {
    console.warn('⚠️ Erreur de géolocalisation, utilisation de la langue du navigateur:', error);
    
    // Fallback: Utiliser la langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('fr')) {
      return 'fr';
    }
    
    return 'en';
  }
};

/**
 * Détecte la langue basée sur le fuseau horaire (méthode alternative)
 * @returns {string} Code de langue ('fr' ou 'en')
 */
export const detectLanguageFromTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Fuseaux horaires d'Afrique de l'Ouest (principalement francophones)
    const francophoneTimezones = [
      'Africa/Abidjan', 'Africa/Accra', 'Africa/Bamako', 'Africa/Banjul',
      'Africa/Bissau', 'Africa/Conakry', 'Africa/Dakar', 'Africa/Freetown',
      'Africa/Lome', 'Africa/Monrovia', 'Africa/Nouakchott', 'Africa/Ouagadougou',
      'Africa/Sao_Tome', 'Africa/Casablanca', 'Africa/El_Aaiun', 'Africa/Algiers',
      'Africa/Tunis', 'Africa/Lagos', 'Africa/Douala', 'Africa/Kinshasa',
      'Africa/Lubumbashi', 'Africa/Brazzaville', 'Africa/Bangui', 'Africa/Ndjamena',
      'Africa/Malabo', 'Africa/Libreville', 'Africa/Porto-Novo', 'Africa/Niamey',
      'Europe/Paris', 'Europe/Brussels', 'Europe/Luxembourg', 'Europe/Monaco',
      'America/Montreal', 'America/Quebec', 'Indian/Antananarivo', 'Indian/Comoro',
      'Indian/Mayotte'
    ];

    if (francophoneTimezones.includes(timezone)) {
      console.log(`🕐 Fuseau horaire détecté: ${timezone} → Langue: fr`);
      return 'fr';
    }

    console.log(`🕐 Fuseau horaire détecté: ${timezone} → Langue: en (par défaut)`);
    return 'en';
  } catch (error) {
    console.warn('⚠️ Erreur de détection de fuseau horaire:', error);
    return 'en';
  }
};

/**
 * Détecte la langue avec plusieurs méthodes (géolocalisation IP + fuseau horaire)
 * @returns {Promise<string>} Code de langue ('fr' ou 'en')
 */
export const detectLanguage = async () => {
  // Essayer d'abord la géolocalisation IP
  try {
    const langFromGeo = await detectLanguageFromGeolocation();
    return langFromGeo;
  } catch (error) {
    // Si ça échoue, utiliser le fuseau horaire
    return detectLanguageFromTimezone();
  }
};

