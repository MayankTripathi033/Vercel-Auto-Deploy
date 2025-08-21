export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the request body
      const { branch, projectName } = await request.json();
      
      if (!branch) {
        return new Response(JSON.stringify({ error: 'Branch name is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (!projectName) {
        return new Response(JSON.stringify({ error: 'Project name is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Get Vercel token from environment variables
      const vercelToken = env.VERCEL_TOKEN;
      
      if (!vercelToken) {
        return new Response(JSON.stringify({ error: 'Vercel token not configured' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 🔧 CONFIGURE YOUR GITHUB REPOSITORY HERE
      // ==========================================
      // Replace with your GitHub repository (format: username/repo-name)
      // Example: 'johndoe/my-awesome-app'
      // Note: projectName now comes from the request body
      const githubRepo = 'your-username/your-repo';
      
      // Prepare the deployment request
      const deploymentData = {
        name: projectName,
        source: 'github',
        gitSource: {
          type: 'github',
          repo: githubRepo,
          ref: branch,
        },
        projectSettings: {
          framework: null, // Vercel will auto-detect
        },
      };

      // Call Vercel API
      const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData),
      });

      const result = await vercelResponse.json();

      if (!vercelResponse.ok) {
        console.error('Vercel API Error:', result);
        return new Response(JSON.stringify({ 
          error: 'Vercel deployment failed', 
          details: result.error?.message || 'Unknown error' 
        }), {
          status: vercelResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Return the deployment URL
      const deploymentUrl = `https://${result.url}`;
      
      return new Response(JSON.stringify({
        success: true,
        deploymentUrl,
        deploymentId: result.uid,
        branch,
        status: result.readyState || 'BUILDING',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Deployment error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};