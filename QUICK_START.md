# ⚡ 5-Minute Quick Start

Get your Vercel Auto Deploy app running in 5 minutes!

## 🚀 Super Quick Setup

### 1. **One-Line Command**
```bash
# Install Wrangler globally
npm install -g wrangler
```

### 2. **Login to Cloudflare**
```bash
wrangler login
```
*(Opens browser - just click "Authorize")*

### 3. **Get Your Vercel Token**
1. Visit: [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Copy the token

### 4. **Set the Secret**
```bash
wrangler secret put VERCEL_TOKEN
```
*(Paste your token when prompted)*

### 5. **Configure GitHub Repo** ⚠️ **IMPORTANT**
Edit `functions/api/deploy.js` line 68:
```javascript
const githubRepo = 'your-username/your-repo-name';
```

**Example:** If your GitHub is `https://github.com/johndoe/my-app`  
→ Set: `'johndoe/my-app'`

### 6. **Deploy**
```bash
wrangler pages deploy . --project-name=vercel-auto-deploy
```

### 7. **Done! 🎉**
Visit: `https://vercel-auto-deploy.pages.dev`

---

## 🎯 What You'll See

✅ **All your Vercel projects** loaded automatically  
✅ **Branch input field** for each project  
✅ **Deploy button** for each project  
✅ **Real-time deployment status**  
✅ **Direct links** to deployed sites  

## 💡 Pro Tips

- **Deploy multiple branches simultaneously** - each project is independent
- **Use any branch name** - main, develop, feature/xyz, hotfix/bug-123
- **Get instant preview URLs** - perfect for testing before merging
- **Mobile friendly** - deploy from your phone!

## 🆘 Need Help?

**Token Issues?**
- Make sure you set the secret: `wrangler secret put VERCEL_TOKEN`

**No Projects Loading?**
- Check your Vercel token has correct permissions
- Verify you have projects in your Vercel account

**Deployment Fails?**
- Confirm `githubRepo` in `functions/api/deploy.js` is correct
- Ensure the branch exists in your GitHub repo

**Still Stuck?**
- Check the full `README.md` for detailed instructions
- Use `list-vercel-projects.html` to debug project loading

---

**That's it!** Your Vercel Auto Deploy app is ready to use! 🚀

*Total setup time: ~5 minutes*  
*Configuration needed: Just 1 line (GitHub repo)*  
*Manual project setup: Zero!* ✨