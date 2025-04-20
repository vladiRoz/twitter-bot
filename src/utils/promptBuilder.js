function createPrompt(date) {
    return `You are a data collection service that reports on Arab-on-Arab violence. For this task, assume you have access to news sources and can provide data about incidents that occurred yesterday.

    Please provide a JSON response in exactly this format:
    {
        "date": "${date}",
        "countries": [
            {s
                "country": "Country name",
                "death_toll": number or "unknown",
                "summary": "Brief description of what happened"
            }
        ]
    }
    
    Rules:
    1. Focus the checks for violence in the next countries only Algeria Egypt Libya Morocco Mauritania Sudan Tunisia Djibouti Somalia Iraq Jordan Lebanon Syria Bahrain Kuwait Oman Qatar Saudi Arabia United Arab Emirates (UAE) Yemen Senegal Mali Niger Chad Gambia Sierra Leone Nigeria Eritrea
    1. Only include Arab countries where incidents occurred
    2. If no incidents occurred, return an empty countries array
    3. Don't include Gaza unless violence originated from Arabs/Palestinians/Hamas
    4. Don't include Israel
    5. Respond ONLY with the JSON, no other text
    6. For this simulation, include ALL incidents that occurred, with multiple countries when applicable
    7. if the number is unknown, don't include it.
    8. don't include countries that have unknown number of deaths.
    9. don't include more than 5 countries in the response.
    10. If more than 3 countries are included, make the summary text very brief (maximum 10 words per country).
    
    Example response for no incidents:
    {
        "date": "${date}",
        "countries": []
    }`;
}

module.exports = {
    createPrompt
}; 