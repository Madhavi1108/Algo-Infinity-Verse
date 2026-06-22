import { fetchWorkflows, analyzeWorkflow } from "./backend/repository-analyzer/cicdValidator.js";

async function run() {
  try {
    // A repo known to have actions
    const url = "https://github.com/expressjs/express";
    console.log(`Fetching workflows from ${url}...`);
    
    const workflows = await fetchWorkflows(url);
    console.log(`Found ${workflows.length} workflows.`);

    for (const wf of workflows) {
      console.log(`\nAnalyzing ${wf.name}...`);
      const res = analyzeWorkflow(wf.content);
      console.log(res);
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
