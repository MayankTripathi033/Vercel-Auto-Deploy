  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  require('dotenv').config({ path: ['.env.local', '.env'] });

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Vercel accounts: VERCEL_ACCOUNTS="name:token:teamId,name2:token2" (teamId optional).
  // Falls back to single VERCEL_TOKEN / VERCEL_TEAM_ID.
  const accounts = (process.env.VERCEL_ACCOUNTS || '').split(',').filter(e => e.trim()).map(e => {
    const [name, token, teamId] = e.split(':').map(x => x.trim());
    return { name, token, teamId };
  });
  if (!accounts.length && process.env.VERCEL_TOKEN) {
    accounts.push({ name: 'default', token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID });
  }
  const getAccount = name => accounts.find(a => a.name === name) || (accounts.length === 1 ? accounts[0] : null);
  const teamQs = (a, sep = '?') => (a.teamId ? `${sep}teamId=${encodeURIComponent(a.teamId)}` : '');

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  // Serve the main HTML file
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // API endpoint to get all Vercel projects
  app.get('/api/projects', async (req, res) => {
    if (!accounts.length) {
      return res.status(500).json({
        success: false,
        error: 'No Vercel account configured. Set VERCEL_ACCOUNTS (or VERCEL_TOKEN) in your environment variables.'
      });
    }

    console.log(`🔍 Fetching Vercel projects from ${accounts.length} account(s)...`);
    const errors = [];

    const lists = await Promise.all(accounts.map(async account => {
      try {
        const vercelResponse = await fetch(`https://api.vercel.com/v9/projects?limit=50${teamQs(account, '&')}`, {
          headers: { 'Authorization': `Bearer ${account.token}` }
        });
        if (!vercelResponse.ok) {
          const errorData = await vercelResponse.json().catch(() => ({}));
          console.error(`Vercel Projects API Error (${account.name}):`, errorData);
          errors.push({ account: account.name, error: errorData.error?.message || vercelResponse.statusText });
          return [];
        }
        const result = await vercelResponse.json();
        return (result.projects || []).map(project => ({
          id: project.id,
          name: project.name,
          account: account.name,
          framework: project.framework || 'Unknown',
          productionUrl: project.targets?.production?.alias?.length
            ? `https://${project.targets.production.alias[0]}`
            : 'No production URL',
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          gitRepository: project.link?.repo || null
        }));
      } catch (error) {
        console.error(`Error fetching projects (${account.name}):`, error);
        errors.push({ account: account.name, error: error.message });
        return [];
      }
    }));

    const projects = lists.flat();
    console.log(`✅ Found ${projects.length} Vercel projects`);

    // Only fail when every account failed; otherwise show what loaded.
    if (errors.length === accounts.length) {
      return res.status(502).json({ success: false, error: 'Failed to fetch projects from Vercel', details: errors });
    }
    res.json({ success: true, projects, total: projects.length, errors, accounts: accounts.map(a => a.name) });
  });

  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
// API endpoint to deploy to Vercel
app.post('/api/deploy', async (req, res) => {
  try {
    const { repository, branch, projectName, account: accountName } = req.body;
    console.log(`Received deployment request: repository=${repository}, branch=${branch}, projectName=${projectName}`);

    // Validation
    if (!branch || !projectName) {
      return res.status(400).json({ success: false, error: 'Branch and project name are required' });
    }

    const account = getAccount(accountName);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: accountName ? `Unknown Vercel account: ${accountName}` : 'Account is required when multiple Vercel accounts are configured'
      });
    }
    const vercelToken = account.token;

    // Vercel needs repoId, or org + repo. Read both from the project's git link.
    const projectResponse = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}${teamQs(account)}`,
      { headers: { 'Authorization': `Bearer ${vercelToken}` } }
    );
    const link = projectResponse.ok ? (await projectResponse.json()).link : null;
    const [repoOrg, repoName] = (repository || '').includes('/') ? repository.split('/') : [link?.org, link?.repo || repository];

    if (!link?.repoId && !(repoOrg && repoName)) {
      return res.status(400).json({
        success: false,
        error: `Project "${projectName}" has no GitHub repo connected in account "${account.name}". Connect it in Vercel → Settings → Git.`
      });
    }

    // Prepare deployment payload
    const deploymentBody = {
      name: projectName,
      target: 'production',
      gitSource: link?.repoId
        ? { type: 'github', ref: branch, repoId: link.repoId }
        : { type: 'github', ref: branch, org: repoOrg, repo: repoName }
    };

    console.log(`📦 Deployment Body:`, JSON.stringify(deploymentBody, null, 2));

    // Use generic deployments endpoint
    const vercelResponse = await fetch(`https://api.vercel.com/v13/deployments${teamQs(account)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentBody)
    });

    const result = await vercelResponse.json();

    if (!vercelResponse.ok) {
      console.error('❌ Deployment failed:', result);
      return res.status(vercelResponse.status).json({
        success: false,
        error: result.error?.message || 'Deployment failed',
        details: result
      });
    }

    // ✅ Success
    const deploymentUrl = `https://${result.url}`;
    console.log(`✅ Deployment successful: ${deploymentUrl}`);

    return res.json({
      success: true,
      deploymentUrl,
      deploymentId: result.uid,
      repository,
      branch,
      account: account.name,
      status: result.readyState || 'BUILDING',
      inspectorUrl: result.inspectorUrl || null
    });

  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});


  // API endpoint to get deployment status (bonus feature)
  app.get('/api/deployment/:deploymentId', async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const account = getAccount(req.query.account);

      if (!account) {
        return res.status(400).json({
          success: false,
          error: 'Unknown or missing Vercel account (?account=name)'
        });
      }

      const vercelResponse = await fetch(`https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}${teamQs(account)}`, {
        headers: {
          'Authorization': `Bearer ${account.token}`,
        }
      });

      const result = await vercelResponse.json();

      if (!vercelResponse.ok) {
        return res.status(vercelResponse.status).json({
          success: false,
          error: 'Failed to get deployment status',
          details: result.error?.message || 'Unknown error'
        });
      }

      res.json({
        success: true,
        status: result.readyState,
        url: `https://${result.url}`,
        createdAt: result.createdAt,
        buildingAt: result.buildingAt,
        readyStateAt: result.readyStateAt
      });

    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      vercelAccounts: accounts.map(a => a.name)
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Vercel Deployer running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from 'public' directory`);
    console.log(`🔑 Vercel accounts: ${accounts.map(a => a.name).join(', ') || 'none'}`);
    
    if (!accounts.length) {
      console.log(`⚠️  Please set VERCEL_ACCOUNTS (or VERCEL_TOKEN) environment variable`);
    }
  });

  module.exports = app;