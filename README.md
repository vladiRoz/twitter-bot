# Arab Violence Reporting Bot

A Twitter bot that creates daily posts about incidents of violence in Arab countries, using data gathered through the OpenAI API.

## Features

- Automatically gathers information about violent incidents in Arab countries from the previous day
- Formats data into a structured JSON format
- Posts daily summaries to Twitter as thread
- Saves historical reports in JSON format

## Setup

1. Clone this repository
2. Install the required dependencies:
   ```
   npm install
   ```
3. Create a `.env` file by copying the `.env.example` file:
   ```
   cp .env.example .env
   ```
4. Add your API keys to the `.env` file:
   - Get an OpenAI API key from [https://platform.openai.com/](https://platform.openai.com/)
   - Create a Twitter Developer account and get API keys from [https://developer.twitter.com/](https://developer.twitter.com/)

## Usage

### Run once manually

```
npm start
```
or
```
node bot.js
```

### Run on a daily schedule

```
npm run schedule
```
or
```
node schedule_bot.js
```

This will run the bot immediately and then schedule it to run every day at 8:00 AM.

## Data Format

The bot collects and stores data in the following format:

```json
{
    "date": "YYYY-MM-DD",
    "countries": [
        {
            "country": "Country name",
            "death_toll": number or "unknown",
            "summary": "Brief description of what happened"
        },
        ...
    ]
}
```

Reports are saved in the `reports/` directory with filenames in the format `YYYYMMDD_report.json`.

## Deployment to DigitalOcean

1. Create a DigitalOcean Droplet with Node.js pre-installed
2. Clone this repository on your Droplet
3. Install dependencies with `npm install`
4. Set up environment variables in `.env`
5. Use PM2 to keep the scheduler running:
   ```
   npm install -g pm2
   pm2 start schedule_bot.js --name "arab-violence-bot"
   pm2 save
   pm2 startup
   ```

## Notes

- The bot uses the GPT-4o model through OpenAI's API to gather and summarize information
- Daily reports are posted as Twitter threads
- If no incidents are reported for a day, a single message will be posted stating that no incidents were reported
- This application is optimized for low resource consumption, making it ideal for small VPS deployments 