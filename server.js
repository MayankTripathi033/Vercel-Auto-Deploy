  const express = require('express');
  const cors = require('cors');
  const path = require('path');
  require('dotenv').config();

  const app = express();
  const PORT = process.env.PORT || 3000;

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
    try {
      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken) {
        return res.status(500).json({
          success: false,
          error: 'Vercel token not configured. Please set VERCEL_TOKEN in your environment variables.'
        });
      }

      console.log('🔍 Fetching Vercel projects...');

      // Fetch projects from Vercel API
      const vercelResponse = await fetch('https://api.vercel.com/v9/projects?limit=50', {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!vercelResponse.ok) {
        const errorData = await vercelResponse.json().catch(() => ({}));
        console.error('Vercel Projects API Error:', errorData);
        return res.status(vercelResponse.status).json({
          success: false,
          error: 'Failed to fetch projects from Vercel',
          details: errorData.error?.message || vercelResponse.statusText
        });
      }

      const result = await vercelResponse.json();
      const projectsArray = result.projects || [];

      // Transform projects data
      const projects = projectsArray.map(project => {
        // Get production URL
        let productionUrl = 'No production URL';
        if (project.targets?.production?.alias && project.targets.production.alias.length > 0) {
          productionUrl = `https://${project.targets.production.alias[0]}`;
        }

        return {
          id: project.id,
          name: project.name,
          framework: project.framework || 'Unknown',
          productionUrl: productionUrl,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          gitRepository: project.link?.repo || null
        };
      });

      console.log(`✅ Found ${projects.length} Vercel projects`);

      res.json({
        success: true,
        projects: projects,
        total: projects.length
      });

    } catch (error) {
      console.error('Error fetching Vercel projects:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
  // API endpoint to deploy to Vercel
// API endpoint to deploy to Vercel
app.post('/api/deploy', async (req, res) => {
  try {
    const { repository, branch, projectName } = req.body;
    console.log(`Received deployment request: repository=${repository}, branch=${branch}, projectName=${projectName}`);

    // Validation
    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID; // 👈 store teamId in env
    if (!vercelToken || !teamId) {
      return res.status(500).json({
        success: false,
        error: 'Vercel token or teamId not configured. Please set VERCEL_TOKEN and VERCEL_TEAM_ID in your environment variables.'
      });
    }

    // Resolve repoId (you can hardcode from project data too)
    async function getRepoId(repoName) {
      try {
        const reposResponse = await fetch(`https://api.vercel.com/v9/projects?teamId=${teamId}`, {
          headers: { 'Authorization': `Bearer ${vercelToken}` }
        });

        if (!reposResponse.ok) {
          console.warn('⚠️ Failed to fetch projects');
          return null;
        }

        const reposData = await reposResponse.json();
        const project = reposData.projects.find(
          p => p.name === projectName || (repository && p.link?.repo === repository)
        );
        if (project?.link?.repoId) {
          console.log(`✅ Found repoId: ${project.link.repoId}`);
          return project.link.repoId;
        }
        return null;
      } catch (error) {
        console.warn(`⚠️ Error fetching repoId: ${error.message}`);
        return null;
      }
    }

    const repoId = await getRepoId(repository);

    // Prepare deployment payload
    const deploymentBody = {
      name: projectName || (repository ? repository.split('/')[1] : 'deployment'),
      target: 'production',
      gitSource: {
        type: 'github',
        ref: branch,
        ...(repoId && { repoId }),
        ...(repository && !repoId && { repo: repository })
      }
    };

    console.log(`📦 Deployment Body:`, JSON.stringify(deploymentBody, null, 2));

    // Use generic deployments endpoint
    const vercelResponse = await fetch(`https://api.vercel.com/v13/deployments?teamId=${teamId}`, {
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
      const vercelToken = process.env.VERCEL_TOKEN;

      if (!vercelToken) {
        return res.status(500).json({
          success: false,
          error: 'Vercel token not configured'
        });
      }

      const vercelResponse = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
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
      vercelTokenConfigured: !!process.env.VERCEL_TOKEN
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Vercel Deployer running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from 'public' directory`);
    console.log(`🔑 Vercel token ${process.env.VERCEL_TOKEN ? 'is configured' : 'is NOT configured'}`);
    
    if (!process.env.VERCEL_TOKEN) {
      console.log(`⚠️  Please set VERCEL_TOKEN environment variable`);
    }
  });

  module.exports = app;