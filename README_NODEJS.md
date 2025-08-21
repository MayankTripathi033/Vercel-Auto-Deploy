# 🚀 Vercel Branch Deployer (Node.js + Express)

A powerful web application that automatically loads all your Vercel projects and lets you deploy any GitHub branch with just a few clicks.

## ✨ Features

- 🌐 **Auto-Project Detection** - Automatically loads all your Vercel projects
- 🎯 **Individual Deploy Forms** - Each project gets its own branch input and deploy button
- ⚡ **Multi-Project Deployment** - Deploy to multiple projects simultaneously
- 🔗 **Direct Vercel Integration** - Uses Vercel REST API v9 and v13
- 📋 **Project Metadata Display** - Shows framework, production URLs, and more
- 📋 **Deployment History** - Tracks recent deployments locally
- 📱 **Mobile Friendly** - Responsive design works on all devices
- ⌨️ **Keyboard Shortcuts** - Ctrl+Enter to deploy quickly
- 🔄 **Auto-Refresh** - Projects update automatically every 5 minutes

## 🏗️ Project Structure

```
vercel-deployer/
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── public/
│   ├── index.html         # Frontend interface
│   ├── style.css          # Styling
│   └── script.js          # Frontend JavaScript
└── README_NODEJS.md       # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Your `.env` file is already configured with your Vercel token:
```bash
VERCEL_TOKEN=tGmR9VYTsGPaIztPubNRI36F
PORT=3000
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development (with nodemon for auto-restart)
npm run dev

# Production
npm start
```

### 4. Open in Browser

Visit: http://localhost:3000

## 📖 How to Use

### **🎯 Primary Method: Auto-Loaded Projects**

1. **Open Browser**: Visit http://localhost:3000
2. **See All Projects**: All your Vercel projects load automatically
3. **Choose Project**: Find the project you want to deploy to
4. **Enter Branch**: Type branch name in that project's input field
   - Example: `main`, `develop`, `feature/new-ui`
5. **Click Deploy**: Hit the "🚀 Deploy" button for that specific project
6. **Get URL**: Receive the deployment URL instantly!

### **🔧 Fallback Method: Manual Entry**

1. **Scroll to Manual Deploy** section at the bottom
2. **Enter Repository**: Type your GitHub repo in format `username/repo-name`
3. **Enter Branch**: Type the branch name you want to deploy
4. **Click Deploy**: Hit the "🚀 Deploy to Vercel" button

### **⚡ Multi-Project Deployment**

- Deploy to **multiple projects simultaneously**
- Each project has **independent status tracking**
- Enter different branch names for different projects
- Monitor all deployments in real-time

## 🔧 API Endpoints

### `GET /api/projects`
Get all Vercel projects from your account

**Response (Success):**
```json
{
  "success": true,
  "projects": [
    {
      "id": "prj_abc123",
      "name": "my-awesome-app",
      "framework": "nextjs",
      "productionUrl": "https://my-awesome-app.vercel.app",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "gitRepository": "username/my-awesome-app"
    }
  ],
  "total": 15
}
```

### `POST /api/deploy`
Deploy a GitHub branch to Vercel (supports both project-based and repository-based)

**Request Body (Project-based):**
```json
{
  "projectName": "my-awesome-app",
  "branch": "main"
}
```

**Request Body (Repository-based):**
```json
{
  "repository": "username/repo-name",
  "branch": "branch-name"
}
```

**Response (Success):**
```json
{
  "success": true,
  "deploymentUrl": "https://your-app-xyz123.vercel.app",
  "deploymentId": "abc123def456",
  "repository": "username/repo-name",
  "branch": "branch-name",
  "status": "BUILDING"
}
```

### `GET /api/deployment/:deploymentId`
Check deployment status

**Response:**
```json
{
  "success": true,
  "status": "READY",
  "url": "https://your-app-xyz123.vercel.app",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "vercelTokenConfigured": true
}
```

## 🎨 Frontend Features

- **Auto-Project Loading**: Fetches and displays all Vercel projects on page load
- **Project Cards**: Rich display with project name, framework, and production URL
- **Individual Deploy Forms**: Each project gets its own branch input and deploy button
- **Multi-Project Support**: Deploy to multiple projects simultaneously
- **Real-time Status**: Independent status tracking for each project deployment
- **Form Validation**: Real-time validation of repository format (for manual deploy)
- **Loading States**: Visual feedback during project loading and deployment
- **Success/Error Messages**: Clear status indicators per project
- **Deployment History**: Stores last 5 deployments in localStorage
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Auto-Refresh**: Projects automatically refresh every 5 minutes
- **Manual Fallback**: Manual deploy section for edge cases
- **Keyboard Shortcuts**: 
  - `Ctrl+Enter` to deploy from focused form
  - `Escape` to hide status messages

## 🔒 Security Notes

- Vercel token is stored securely in environment variables
- No sensitive data is exposed to the frontend
- CORS is configured for security
- Input validation prevents injection attacks

## 🐛 Troubleshooting

### "Vercel token not configured"
- Make sure your `.env` file contains `VERCEL_TOKEN=your_actual_token`
- Restart the server after changing environment variables

### "Repository must be in format: username/repository"
- Use the exact format: `username/repo-name`
- Don't include `https://github.com/` prefix

### "Deployment failed"
- Check that the repository exists and you have access
- Verify the branch name exists in the repository
- Ensure your Vercel token has necessary permissions

### Connection refused
- Make sure the server is running (`npm start` or `npm run dev`)
- Check that port 3000 is not being used by another application
- Try a different port by setting `PORT=3001` in `.env`

## 🚀 Deployment Options

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production Server
```bash
npm start  # Direct node execution
```

### Deploy to Cloud
You can deploy this Node.js app to:
- **Heroku**: Create Procfile with `web: node server.js`
- **Railway**: Will auto-detect Node.js app
- **DigitalOcean App Platform**: Push to Git repository
- **AWS EC2**: Run with PM2 for production

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VERCEL_TOKEN` | Your Vercel API token | ✅ Yes |
| `PORT` | Server port (default: 3000) | ❌ Optional |
| `NODE_ENV` | Environment mode | ❌ Optional |

## 🎯 Example Usage Scenarios

### **Scenario 1: Multi-Project Feature Deploy**
```
1. You push features to multiple repositories
2. Open http://localhost:3000
3. See all 15 projects loaded automatically
4. Project "my-blog": Enter "feature/new-design" → Deploy
5. Project "portfolio": Enter "main" → Deploy
6. Project "api-service": Enter "feature/auth" → Deploy
7. Monitor all three deployments with independent status
8. Get 3 deployment URLs instantly
```

### **Scenario 2: Quick PR Testing**
```
1. Developer creates PR with branch "fix/user-auth"
2. Open the app, find the project in the auto-loaded list
3. Enter "fix/user-auth" in that project's branch field
4. Click Deploy for that specific project
5. Get preview URL while other projects remain untouched
6. Test the fix and approve/reject the PR
```

### **Scenario 3: Environment Management**
```
1. Need to deploy different branches to different environments
2. All projects visible in one dashboard
3. Production project: Deploy "main" branch
4. Staging project: Deploy "develop" branch  
5. Testing project: Deploy "feature/experimental"
6. All deployments happen simultaneously with real-time tracking
```

### **Scenario 4: Team Collaboration**
```
1. Multiple team members can use the same interface
2. Each person can deploy their features independently
3. See all available projects without asking for names
4. Deploy multiple branches for review simultaneously
5. Share deployment URLs easily
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Deploying!** 🚀

For more information about Vercel's API, check out the [official documentation](https://vercel.com/docs/rest-api).