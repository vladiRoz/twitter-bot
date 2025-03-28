function formatMessage(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data provided to formatMessage');
  }

  if (!data.date) {
    throw new Error('No date provided in data');
  }

  // Handle case with no incidents
  if (!data.countries || data.countries.length === 0) {
    return {
      full: `📊 Violence Report for ${data.date}\n\nNo incidents of violence reported today.`,
      summary: null
    };
  }

  // Construct full message
  let fullMessage = `📊 Violence Report for ${data.date}\n\n`;
  
  data.countries.forEach(country => {
    const countryName = country.name || country.country;
    const deathToll = country.deathToll || country.death_toll;
    const summary = country.summary;
    const flag = country.flag || '🏳️';

    fullMessage += `${flag} ${countryName}:\n`;
    fullMessage += `Casualties: ${deathToll}\n`;
    if (summary) {
      fullMessage += `${summary}\n`;
    }
    fullMessage += '\n';
  });

  // Create summary version if full message is too long
  let summaryMessage = null;
  if (fullMessage.length > 280) {
    const totalCountries = data.countries.length;
    const totalCasualties = data.countries.reduce((sum, country) => {
      const casualties = country.deathToll || country.death_toll || 0;
      return sum + casualties;
    }, 0);
    const avgCasualties = Math.round(totalCasualties / totalCountries);
    
    summaryMessage = `📊 Violence Report for ${data.date}\n\n`;
    summaryMessage += `${totalCountries} countries affected\n`;
    summaryMessage += `Total casualties: ${totalCasualties}\n`;
    summaryMessage += `Average casualties per country: ${avgCasualties}\n\n`;
    summaryMessage += `Full report: ${process.env.WEBSITE_URL || 'website.com'}`;
  }

  return {
    full: fullMessage,
    summary: summaryMessage
  };
}

module.exports = {
  formatMessage
}; 