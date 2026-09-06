import { exec } from "child_process";
import util from "util";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

const execAsync = util.promisify(exec);

// Ensure the local Python virtual environment and pipx bin are in the PATH
const venvBinPath = `${os.homedir()}/.agent-reach-venv/bin`;
const localBinPath = `${os.homedir()}/.local/bin`;
const customEnv = { 
  ...process.env, 
  PATH: `${localBinPath}:${venvBinPath}:${process.env.PATH || ""}` 
};

/**
 * Service to wrap the Python agent-reach CLI tools.
 * Note: Twitter and LinkedIn searches will require valid cookies in .env.
 */

export async function searchTwitter(query, maxResults = 10) {
  try {
    // agent-reach twitter-cli uses TWITTER_AUTH_TOKEN and TWITTER_CT0
    const { stdout, stderr } = await execAsync(`twitter search "${query}" -n ${maxResults} </dev/null`, { env: customEnv, timeout: 10000 });
    
    if (stderr && stderr.toLowerCase().includes("unauthorized")) {
      console.warn("[Agent Reach] Twitter Auth Failed - Missing or invalid cookies in .env");
      return [];
    }

    return stdout;
  } catch (err) {
    console.error("[Agent Reach] Twitter Search Error:", err.message);
    throw err;
  }
}

export async function searchGenericWeb(query) {
  try {
    // Requires mcporter & exa mcp to be configured
    // Use the explicit tool call syntax
    const { stdout } = await execAsync(`mcporter call 'exa.web_search_exa(query: "${query}")' </dev/null`, { env: customEnv, timeout: 10000 });
    return stdout;
  } catch (err) {
    console.error("[Agent Reach] Web Search Error:", err.message);
    throw err;
  }
}

export async function readWebpage(url) {
  try {
    // Agent Reach uses Jina Reader for reading web pages
    const { stdout } = await execAsync(`curl -s "https://r.jina.ai/${url}" </dev/null`, { env: customEnv, timeout: 15000 });
    return stdout;
  } catch (err) {
    console.error("[Agent Reach] Web Read Error:", err.message);
    throw err;
  }
}
