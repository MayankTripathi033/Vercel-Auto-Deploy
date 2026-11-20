# Vercel Auto Deploy 🚀

A Node.js + Express project that allows you to deploy different branches of your GitHub repository to Vercel by simply typing the branch name.

## Features

- 🌐 Modern web interface served by Express
- ⚡ REST API powered by Express
- 🔄 **Auto-fetch all your Vercel projects** - no manual configuration needed!
- 🎯 Deploy any GitHub branch to any project instantly
- 📋 Individual deploy forms for each project with branch input
- 🔗 Direct integration with Vercel Deployment API
- 📱 Responsive design with modern UI
- 🔄 Real-time deployment status and links

## Project Structure

```
vercel-auto-deploy/
├── functions/
│   └── api/
│       ├── deploy.js          # Cloudflare Worker for deployments
│       └── projects.js        # Cloudflare Worker for fetching projects
├── index.html                 # Frontend interface (auto-fetches projects)
├── list-vercel-projects.html  # Standalone helper tool
├── server.js                 # Express server
├── package.json              # Project dependencies
├── .env.example              # Environment variables template
├── .gitignore               # Git exclusions
├── deploy.ps1               # Windows deployment script
└── README.md                # This file
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or later)
- A Cloudflare account
- A Vercel account
- A GitHub repository you want to deploy

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure GitHub Repository (Important!)

You **only** need to configure your GitHub repository now - projects are auto-loaded!

(Optional) If you were using the worker version: Edit `functions/api/deploy.js` and update the GitHub repo:

```javascript
// Line 68 - Update this with your actual GitHub repo
const githubRepo = 'your-username/your-repo-name';
```

**Example:**
- If your repo is `https://github.com/johndoe/my-awesome-app`
- Set: `const githubRepo = 'johndoe/my-awesome-app';`

### 4. Get Your Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "Cloudflare Auto Deploy")
4. Set scope to your account
5. Copy the token (you'll need it in the next step)

### 5. Set Environment Variables

Create a `.env` file from `.env.example` and set:

```
# One entry per Vercel account: name:token:teamId (teamId optional), comma-separated
VERCEL_ACCOUNTS=personal:token_one,work:token_two:team_abc123
PORT=3000
```

Projects from all accounts are listed together, each tagged with its account name.
A single `VERCEL_TOKEN` / `VERCEL_TEAM_ID` still works when `VERCEL_ACCOUNTS` is empty.

No Cloudflare account or Wrangler needed.

## Local Development

To run the project locally:

```bash
npm run dev
```

This will start a local development server at `http://localhost:3000` (or the port you set)

## Deployment

### Deploy

You can deploy this app to any Node hosting or Vercel as a Node server.

- Build step: none
- Start command: `node server.js`
- Env vars: `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `PORT`

If deploying to Vercel as a server, configure it to run `server.js` with Node and expose the `public` folder for static files.

## Usage

1. Visit your app URL
2. **All your Vercel projects will be automatically loaded and displayed!**
3. For each project you want to deploy:
   - Enter the branch name (e.g., `main`, `develop`, `feature/new-ui`)
   - Click the "Deploy" button for that specific project
4. Wait for the deployment to complete
5. Click the generated URL to visit your deployed site
6. **Deploy multiple projects simultaneously** - each has its own deploy form!

## Configuration Options

### Vercel Project Settings

You can customize the deployment by modifying the `deploymentData` object in `functions/api/deploy.js`:

```javascript
const deploymentData = {
  name: projectName,
  source: 'github',
  gitSource: {
    type: 'github',
    repo: githubRepo,
    ref: branch,
  },
  projectSettings: {
    framework: null, // Auto-detect, or specify: 'nextjs', 'react', 'vue', etc.
    buildCommand: '', // Custom build command if needed
    installCommand: '', // Custom install command if needed
    outputDirectory: '', // Custom output directory if needed
  },
};
```

### Environment Variables

You can add more secrets for different environments:

```bash
# Production
npx wrangler secret put VERCEL_TOKEN --env production

# Preview/staging
npx wrangler secret put VERCEL_TOKEN --env preview
```

## Troubleshooting

### Common Issues

1. **"Vercel token not configured"**
   - Make sure you've set the `VERCEL_TOKEN` secret using `wrangler secret put VERCEL_TOKEN`

2. **"Repository not found"**
   - Verify your `githubRepo` format is correct (`username/repo-name`)
   - Ensure your Vercel token has access to the repository

3. **"Branch not found"**
   - Make sure the branch exists in your GitHub repository
   - Branch names are case-sensitive

4. **"Deployment failed"**
   - Check the browser console for detailed error messages
   - Verify your Vercel project settings allow deployments from the specified repository

### Debugging

To see detailed logs during local development:

```bash
npx wrangler pages dev . --compatibility-date=2024-01-01 --local
```

## Security Notes

- The Vercel token is stored securely as a Cloudflare secret
- API requests include CORS headers for browser security
- No sensitive information is exposed in the frontend code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Need Help?**
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vercel API Documentation](https://vercel.com/docs/rest-api)