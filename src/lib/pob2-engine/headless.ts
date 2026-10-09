import { access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 30_000;

export type Pob2EngineStatus = {
  configured: boolean;
  enginePath: string;
  headlessWrapper: boolean;
  bridgeScript: boolean;
  luajit: string;
  ready: boolean;
};

function projectRoot() {
  return process.cwd();
}

export function getPob2EnginePath() {
  return process.env.POB2_ENGINE_PATH || path.join(projectRoot(), ".pob2-engine");
}

export function getLuaJitCommand() {
  return process.env.LUAJIT_PATH || "luajit";
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getPob2EngineStatus(): Promise<Pob2EngineStatus> {
  const enginePath = getPob2EnginePath();
  const headlessWrapper = await exists(path.join(enginePath, "src", "HeadlessWrapper.lua"));
  const bridgeScript = await exists(path.join(enginePath, "src", "FIXLGS_Smoke.lua"));
  return {
    configured: headlessWrapper,
    enginePath,
    headlessWrapper,
    bridgeScript,
    luajit: getLuaJitCommand(),
    ready: headlessWrapper && bridgeScript,
  };
}

export type Pob2SmokeResult = Pob2EngineStatus & {
  ok: boolean;
  code?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export async function runPob2Smoke(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Pob2SmokeResult> {
  const status = await getPob2EngineStatus();
  if (!status.ready) {
    return {
      ok: false,
      ...status,
      error: "PoB2 headless engine is not prepared. Run scripts/setup-pob2-engine.ps1 first.",
    };
  }

  const cwd = path.join(status.enginePath, "src");
  const runtimeLua = path.join(status.enginePath, "runtime", "lua");
  const runtimeNative = path.join(status.enginePath, "runtime");
  const separator = ";";

  const luaPath = [
    path.join(runtimeLua, "?.lua"),
    path.join(runtimeLua, "?", "init.lua"),
    process.env.LUA_PATH || "",
  ].filter(Boolean).join(separator) + `${separator}${separator}`;

  const luaCPath = [
    path.join(runtimeNative, "?.dll"),
    path.join(runtimeNative, "?.so"),
    process.env.LUA_CPATH || "",
  ].filter(Boolean).join(separator) + `${separator}${separator}`;

  return new Promise<Pob2SmokeResult>((resolve) => {
    const child = spawn(status.luajit, ["FIXLGS_Smoke.lua"], {
      cwd,
      env: {
        ...process.env,
        LUA_PATH: luaPath,
        LUA_CPATH: luaCPath,
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (payload: Pob2SmokeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    };

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      finish({ ok: false, ...status, error: error.message, stdout, stderr });
    });
    child.on("close", (code) => {
      const ok = code === 0 && stdout.includes("FIXLGS_POB2_READY");
      finish({ ok, ...status, code, stdout, stderr });
    });

    const timer = setTimeout(() => {
      child.kill();
      finish({
        ok: false,
        ...status,
        error: `PoB2 smoke test timed out after ${timeoutMs}ms`,
        stdout,
        stderr,
      });
    }, timeoutMs);
  });
}
