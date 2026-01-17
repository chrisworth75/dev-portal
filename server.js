const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 9000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API endpoint to get postman collections
app.get('/api/postman-collections', (req, res) => {
  const collectionsDir = path.join(__dirname, 'postman-collections');

  if (!fs.existsSync(collectionsDir)) {
    return res.json([]);
  }

  const files = fs.readdirSync(collectionsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const content = fs.readFileSync(path.join(collectionsDir, file), 'utf8');
      return {
        filename: file,
        data: JSON.parse(content)
      };
    });

  res.json(files);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Project paths for git branch checking
const PROJECT_PATHS = {
  'vote': '/Users/chris/dev-vote',
  'freg': '/Users/chris/dev-freg',
  'family-tree': '/Users/chris/dev-familytree',
  'movies': '/Users/chris/dev-movies',
  'feepay': '/Users/chris/dev-feepay',
  'share': '/Users/chris/dev-share'
};

// Docker service configuration - individual services
// Maps service IDs to their docker-compose paths and individual service repo paths for git branch checking
const DOCKER_SERVICES = {
  'vote-ui': { path: '/Users/chris/dev-vote', service: 'vote-ui', projectPath: '/Users/chris/dev-vote/vote-ui' },
  'vote-ui-vue': { path: '/Users/chris/dev-vote', service: 'vote-ui-vue', projectPath: '/Users/chris/dev-vote/vote-ui-vue' },
  'vote-ui-react': { path: '/Users/chris/dev-vote', service: 'vote-ui-react', projectPath: '/Users/chris/dev-vote/vote-ui-react' },
  'vote-ui-angular': { path: '/Users/chris/dev-vote', service: 'vote-ui-angular', projectPath: '/Users/chris/dev-vote/vote-ui-angular' },
  'vote-api': { path: '/Users/chris/dev-vote', service: 'vote-api', projectPath: '/Users/chris/dev-vote/vote-api' },
  'vote-db': { path: '/Users/chris/dev-vote', service: 'vote-db', projectPath: '/Users/chris/dev-vote/vote-db' },
  'freg-angular': { path: '/Users/chris/dev-freg', service: 'freg-frontend', projectPath: '/Users/chris/dev-freg/freg-ang' },
  'freg-react': { path: '/Users/chris/dev-freg', service: 'freg-react-frontend', projectPath: '/Users/chris/dev-freg/freg-react' },
  'freg-api': { path: '/Users/chris/dev-freg', service: 'freg-api', projectPath: '/Users/chris/dev-freg/freg-api' },
  'freg-db': { path: '/Users/chris/dev-freg', service: 'freg-db', projectPath: '/Users/chris/dev-freg/freg-db' },
  'family-tree-app': { path: '/Users/chris/dev-familytree', service: 'family-tree-app', projectPath: '/Users/chris/dev-familytree/family-tree-app' },
  'movies-react': { path: '/Users/chris/dev-movies', service: 'movies-react', projectPath: '/Users/chris/dev-movies/movies-react' },
  'movies-vue': { path: '/Users/chris/dev-movies', service: 'movies-vue', projectPath: '/Users/chris/dev-movies/movies-vue' },
  'movies-angular': { path: '/Users/chris/dev-movies', service: 'movies-angular', projectPath: '/Users/chris/dev-movies/movies-angular' },
  'movies-wireframe': { path: '/Users/chris/dev-movies', service: 'movies-wireframe', projectPath: '/Users/chris/dev-movies/movies-wireframe' },
  'movies-api': { path: '/Users/chris/dev-movies', service: 'movies-api', projectPath: '/Users/chris/dev-movies/movies-api' },
  'movies-db': { path: '/Users/chris/dev-movies', service: 'movies-db', projectPath: '/Users/chris/dev-movies/movies-db' },
  'imdb-db': { path: '/Users/chris/dev-movies', service: 'imdb-db', projectPath: '/Users/chris/dev-movies/imdb-db' },
  'ccpay-bubble': { path: '/Users/chris/dev-feepay', service: 'ccpay-bubble', projectPath: '/Users/chris/dev-feepay/ccpay-bubble' },
  'paybubble-ang': { path: '/Users/chris/dev-feepay', service: 'paybubble-ang', projectPath: '/Users/chris/dev-feepay/paybubble-ang' },
  'paybubble-react': { path: '/Users/chris/dev-feepay', service: 'paybubble-react', projectPath: '/Users/chris/dev-feepay/paybubble-react' },
  'db-tool-spring-boot': { path: '/Users/chris/dev-feepay', service: 'db-tool-spring-boot', projectPath: '/Users/chris/dev-feepay/db-tool-spring-boot' },
  // Share (Shareround) services
  'shareround-api': { path: '/Users/chris/dev-share/shareround', service: 'app', projectPath: '/Users/chris/dev-share/shareround' },
  'shareround-db': { path: '/Users/chris/dev-share/shareround', service: 'db', projectPath: '/Users/chris/dev-share/shareround' },
};

// Docker stack configuration - entire projects
// Using container name prefixes to identify stacks since we can't access host filesystem
const DOCKER_STACKS = {
  'vote': {
    name: 'Vote',
    containers: ['vote-ui', 'vote-ui-vue', 'vote-ui-react', 'vote-ui-angular', 'vote-api', 'vote-db']
  },
  'freg': {
    name: 'Freg',
    containers: ['freg-frontend', 'freg-react-frontend', 'freg-api', 'freg-db']
  },
  'family-tree': {
    name: 'Family Tree',
    containers: ['family-tree-app']
  },
  'movies': {
    name: 'Movies',
    containers: ['movies-react', 'movies-vue', 'movies-angular', 'movies-wireframe', 'movies-api', 'movies-db', 'imdb-db']
  },
  'feepay': {
    name: 'Fee & Pay',
    containers: ['ccpay-bubble', 'paybubble-ang', 'paybubble-react', 'ccpay-payment-app', 'payments-db', 'rse-idam-simulator', 'ccd-api-mock-node', 's2s-mock', 'local-service-bus', 'db-tool-spring-boot']
  },
  'share': {
    name: 'Share',
    containers: ['app', 'db']
  },
};

// Get service status
app.get('/api/service/:serviceId/status', async (req, res) => {
  try {
    const serviceConfig = DOCKER_SERVICES[req.params.serviceId];
    if (!serviceConfig) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const { stdout } = await execAsync(`docker ps --filter "name=${serviceConfig.service}" --format "{{.Names}}"`);
    const isRunning = stdout.trim().length > 0;

    res.json({ running: isRunning, service: serviceConfig.service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle service (start/stop)
app.post('/api/service/:serviceId/toggle', async (req, res) => {
  try {
    const serviceConfig = DOCKER_SERVICES[req.params.serviceId];
    if (!serviceConfig) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check current status
    const { stdout: statusOutput } = await execAsync(`docker ps --filter "name=${serviceConfig.service}" --format "{{.Names}}"`);
    const isRunning = statusOutput.trim().length > 0;

    let command;
    if (isRunning) {
      // Stop the service
      command = `cd ${serviceConfig.path} && docker-compose stop ${serviceConfig.service}`;
    } else {
      // Start the service
      command = `cd ${serviceConfig.path} && docker-compose up -d ${serviceConfig.service}`;
    }

    const { stdout, stderr } = await execAsync(command);
    const newStatus = !isRunning;

    res.json({
      success: true,
      running: newStatus,
      message: newStatus ? 'Service started' : 'Service stopped',
      service: serviceConfig.service,
      output: stdout || stderr
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stderr: error.stderr });
  }
});

// Get stack status (all services in a project)
app.get('/api/stack/:stackId/status', async (req, res) => {
  try {
    const stackConfig = DOCKER_STACKS[req.params.stackId];
    if (!stackConfig) {
      return res.status(404).json({ error: 'Stack not found' });
    }

    // Check which containers are running
    let runningCount = 0;
    for (const containerName of stackConfig.containers) {
      try {
        const { stdout } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
        if (stdout.trim().length > 0) {
          runningCount++;
        }
      } catch (error) {
        // Container doesn't exist or not running, continue
      }
    }

    res.json({
      running: runningCount > 0,
      services: stackConfig.containers,
      runningCount: runningCount,
      totalCount: stackConfig.containers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle stack (start/stop all services)
app.post('/api/stack/:stackId/toggle', async (req, res) => {
  try {
    const stackConfig = DOCKER_STACKS[req.params.stackId];
    if (!stackConfig) {
      return res.status(404).json({ error: 'Stack not found' });
    }

    // Check how many containers are currently running
    let runningCount = 0;
    for (const containerName of stackConfig.containers) {
      try {
        const { stdout } = await execAsync(`docker ps --filter "name=${containerName}" --format "{{.Names}}"`);
        if (stdout.trim().length > 0) {
          runningCount++;
        }
      } catch (error) {
        // Continue
      }
    }

    const isRunning = runningCount > 0;
    const results = [];

    if (isRunning) {
      // Stop all containers in the stack
      for (const containerName of stackConfig.containers) {
        try {
          await execAsync(`docker stop ${containerName}`, { timeout: 30000 });
          results.push(`Stopped ${containerName}`);
        } catch (error) {
          // Container might not exist or already stopped
          results.push(`${containerName}: ${error.message}`);
        }
      }
    } else {
      // Start all containers in the stack
      for (const containerName of stackConfig.containers) {
        try {
          // Check if container exists
          const { stdout: existsOutput } = await execAsync(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`);
          if (existsOutput.trim().length > 0) {
            await execAsync(`docker start ${containerName}`, { timeout: 30000 });
            results.push(`Started ${containerName}`);
          } else {
            results.push(`${containerName}: Container does not exist`);
          }
        } catch (error) {
          results.push(`${containerName}: ${error.message}`);
        }
      }
    }

    const newStatus = !isRunning;

    res.json({
      success: true,
      running: newStatus,
      message: newStatus ? `All ${stackConfig.name} services started` : `All ${stackConfig.name} services stopped`,
      stack: req.params.stackId,
      output: results.join('\n')
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stderr: error.stderr });
  }
});

// Get git branch for all projects
app.get('/api/git/branches', async (req, res) => {
  try {
    const branches = {};

    for (const [projectId, projectPath] of Object.entries(PROJECT_PATHS)) {
      try {
        const { stdout } = await execAsync(`cd ${projectPath} && git branch --show-current`, { timeout: 5000 });
        branches[projectId] = stdout.trim() || 'unknown';
      } catch (error) {
        branches[projectId] = 'error';
      }
    }

    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get git branch for a specific project
app.get('/api/git/branch/:projectId', async (req, res) => {
  try {
    const projectPath = PROJECT_PATHS[req.params.projectId];
    if (!projectPath) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { stdout } = await execAsync(`cd ${projectPath} && git branch --show-current`, { timeout: 5000 });
    const branch = stdout.trim() || 'unknown';

    res.json({ project: req.params.projectId, branch });
  } catch (error) {
    res.status(500).json({ error: error.message, branch: 'error' });
  }
});

// Get git branch for a specific service
app.get('/api/service/:serviceId/branch', async (req, res) => {
  try {
    const serviceConfig = DOCKER_SERVICES[req.params.serviceId];
    if (!serviceConfig) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const projectPath = serviceConfig.projectPath;
    const { stdout } = await execAsync(`cd ${projectPath} && git branch --show-current`, { timeout: 5000 });
    const branch = stdout.trim() || 'unknown';

    res.json({ service: req.params.serviceId, branch });
  } catch (error) {
    res.status(500).json({ error: error.message, branch: 'not a repo' });
  }
});

app.listen(PORT, () => {
  console.log(`Dev Portal running on http://localhost:${PORT}`);
});
