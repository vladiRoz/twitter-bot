# Arab Violence Reporting Bot

A bot that collects data about violence incidents in Arab countries and shares reports on social media platforms.

## Features

- Data collection using AI (Gemini or OpenAI)
- Automatic tweet generation
- Image generation with formatted reports
- Instagram posting with ImgBB image hosting

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Twitter API Keys
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Unsplash API Key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# ImgBB API Key (for image hosting)
IMGBB_API_KEY=your_imgbb_api_key

# Instagram/Facebook API
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
```

### ImgBB Setup

To use ImgBB for image hosting:

1. Sign up for a free account at [ImgBB](https://imgbb.com/)
2. Get your API key from your account settings or via [API page](https://api.imgbb.com/)
3. Add your API key to the `.env` file as `IMGBB_API_KEY=your_api_key`

### Instagram API Setup

To use the Instagram API:

1. Create a Facebook Developer account
2. Create a Facebook App
3. Set up Instagram Basic Display and/or Instagram Graph API
4. Link your Instagram Business Account
5. Generate a Page Access Token with the right permissions
6. Add your Instagram Business Account ID and Facebook Access Token to the `.env` file

## Installation

```bash
npm install
```

## Usage

### Generate Report Image Only

```bash
npm run generate-image
```

### Test ImgBB Upload

```bash
npm run test:imgbb
```

### Twitter Bot

```bash
npm run start:twitter
```

### Instagram Bot

```bash
npm run start:instagram
```

### Run All

```bash
npm run start
```

## Output

Generated reports are saved to:
- JSON reports: `reports/YYYYMMDD_report.json`
- Image reports: `output/violence_report_YYYYMMDD.jpg`

## License

MIT 