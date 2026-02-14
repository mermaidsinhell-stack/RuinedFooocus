import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export interface PythonManagerEvents {
  onProgress: (message: string) => void;
  onReady: (port: number) => void;
  onError: (error: string) => void;
}

// Directories to copy from app bundle to user data on first run
const USER_DATA_DIRS = [
  'wildcards',
  'chatbots',
  'llamas',
  'presets',
];

const USER_DATA_FILES = [
  { from: 'settings/styles.default', to: 'settings/styles.csv' },
  { from: 'settings/styles.default', to: 'settings/styles.default' },
  { from: 'settings/powerup.default', to: 'settings/powerup.default' },
  { from: 'settings/performance.default', to: 'settings/performance.default' },
  { from: 'settings/resolutions.default', to: 'settings/resolutions.default' },
];

export class PythonManager {
  private process: ChildProcess | null = null;
  private port: number;
  private events: PythonManagerEvents;
  private stderrBuffer: string[] = [];

  constructor(port: number, events: PythonManagerEvents) {
    this.port = port;
    this.events = events;
  }

  /**
   * Get paths for the Python executable and backend source.
   * In development: uses system python and project root.
   * In production: uses embedded python and resources/backend.
   */
  private getPaths() {
    const isPackaged = app.isPackaged;
    const resourcesPath = process.resourcesPath;

    if (isPackaged) {
      return {
        pythonExe: path.join(resourcesPath, 'python', 'python.exe'),
        backendDir: path.join(resourcesPath, 'backend'),
      };
    }

    // Development: use system python and parent directory as backend
    return {
      pythonExe: 'python',
      backendDir: path.resolve(__dirname, '..', '..'),
    };
  }

  /**
   * Get the user data directory for persistent files.
   */
  getUserDataDir(): string {
    return path.join(app.getPath('appData'), 'RuinedFooocus');
  }

  /**
   * Copy default user-facing files from app bundle to user data on first run.
   * Skips files/directories that already exist to preserve user modifications.
   */
  async initializeUserData(): Promise<void> {
    const { backendDir } = this.getPaths();
    const userDataDir = this.getUserDataDir();

    this.events.onProgress('Initializing user data...');

    // Ensure base directories exist
    const baseDirs = ['models', 'outputs', 'settings', 'cache'];
    for (const dir of baseDirs) {
      const dirPath = path.join(userDataDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Copy directory trees
    for (const dir of USER_DATA_DIRS) {
      const src = path.join(backendDir, dir);
      const dest = path.join(userDataDir, dir);
      if (!fs.existsSync(dest) && fs.existsSync(src)) {
        this.events.onProgress(`Copying ${dir}...`);
        this.copyDirRecursive(src, dest);
      }
    }

    // Copy OBP userfiles
    const obpSrc = path.join(backendDir, 'random_prompt', 'userfiles');
    const obpDest = path.join(userDataDir, 'random_prompt', 'userfiles');
    if (!fs.existsSync(obpDest) && fs.existsSync(obpSrc)) {
      this.events.onProgress('Copying OBP user files...');
      this.copyDirRecursive(obpSrc, obpDest);
    }

    // Copy individual files
    for (const file of USER_DATA_FILES) {
      const src = path.join(backendDir, file.from);
      const dest = path.join(userDataDir, file.to);
      if (!fs.existsSync(dest) && fs.existsSync(src)) {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
      }
    }

    this.events.onProgress('User data ready.');
  }

  private copyDirRecursive(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this.copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Start the Python backend process.
   */
  async start(): Promise<void> {
    const { pythonExe, backendDir } = this.getPaths();
    const userDataDir = this.getUserDataDir();

    this.events.onProgress('Starting backend server...');

    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      RF_USER_DATA: userDataDir,
      RF_REPOSITORIES_DIR: path.join(userDataDir, 'repositories'),
      PYTHONUNBUFFERED: '1',
    };

    // In packaged mode, set up Python path for embedded distribution
    if (app.isPackaged) {
      const pythonDir = path.join(process.resourcesPath, 'python');
      env.PATH = `${pythonDir};${pythonDir}\\Scripts;${process.env.PATH || ''}`;
    }

    const launchScript = path.join(backendDir, 'launch.py');

    this.process = spawn(pythonExe, [launchScript, '--port', String(this.port)], {
      cwd: backendDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect server ready
        if (trimmed.includes('Uvicorn running on') || trimmed.includes('Application startup complete')) {
          this.events.onReady(this.port);
          return;
        }

        // Parse progress messages for the splash screen
        this.events.onProgress(this.parseProgress(trimmed));
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (text) {
        this.stderrBuffer.push(text);
        // Keep only last 50 lines
        if (this.stderrBuffer.length > 50) {
          this.stderrBuffer.shift();
        }
        // Uvicorn logs to stderr, check for ready signal there too
        if (text.includes('Uvicorn running on') || text.includes('Application startup complete')) {
          this.events.onReady(this.port);
        }
      }
    });

    this.process.on('exit', (code) => {
      if (code !== null && code !== 0) {
        const lastLines = this.stderrBuffer.slice(-10).join('\n');
        this.events.onError(
          `Backend process exited with code ${code}.\n\nLast error output:\n${lastLines}`
        );
      }
      this.process = null;
    });

    this.process.on('error', (err) => {
      this.events.onError(`Failed to start backend: ${err.message}`);
      this.process = null;
    });
  }

  /**
   * Parse stdout lines into user-friendly progress messages.
   */
  private parseProgress(line: string): string {
    if (line.includes('Checking dependencies')) return 'Checking dependencies...';
    if (line.includes('requirements_met')) return 'Dependencies verified.';
    if (line.includes('pip install') || line.includes('Installing')) return `Installing: ${line}`;
    if (line.includes('Cloning') || line.includes('git clone')) return 'Cloning repositories...';
    if (line.includes('Downloading')) return line;
    if (line.includes('Loading model') || line.includes('loading')) return 'Loading models...';
    if (line.includes('Starting server') || line.includes('uvicorn')) return 'Starting server...';
    return line;
  }

  /**
   * Kill the Python process tree.
   */
  async stop(): Promise<void> {
    if (!this.process || this.process.pid === undefined) return;

    const pid = this.process.pid;

    if (process.platform === 'win32') {
      // On Windows, use taskkill to kill the entire process tree
      try {
        spawn('taskkill', ['/T', '/F', '/PID', String(pid)], { stdio: 'ignore' });
      } catch {
        // Fallback to SIGTERM
        this.process.kill('SIGTERM');
      }
    } else {
      // On Unix, kill the process group
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        this.process.kill('SIGTERM');
      }
    }

    this.process = null;
  }

  /**
   * Check if the process is running.
   */
  isRunning(): boolean {
    return this.process !== null;
  }

  /**
   * Get the last stderr lines for error reporting.
   */
  getLastErrors(): string {
    return this.stderrBuffer.slice(-10).join('\n');
  }
}
