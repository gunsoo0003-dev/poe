-- FIXLGS V182: called after launch.main:OnFrame on each frame.
-- We first enter BUILD mode, then inspect its calculated output on a subsequent frame.
local scriptPath = GetScriptPath and GetScriptPath() or "."
local destination = scriptPath .. "/FIXLGS_RuntimeSmoke.result.txt"
local function write(status, lines)
  local file, err = io.open(destination, "w")
  if not file then
    if ConPrintf then ConPrintf("FIXLGS result write failure: %s", tostring(err)) end
    return
  end
  file:write(status, "\n")
  for _, line in ipairs(lines or {}) do file:write(tostring(line), "\n") end
  file:close()
end
local function finish(status, lines)
  write(status, lines)
  _G.FIXLGS_smokeStage = "finished"
  Exit()
end
local ok, err = pcall(function()
  local main = launch and launch.main
  if not main then error("Launch main missing") end
  if launch.promptMsg then error("PoB startup prompt: " .. tostring(launch.promptMsg)) end
  if not _G.FIXLGS_smokeStage then
    _G.FIXLGS_smokeStage = "build-requested"
    write("FIXLGS_POB2_PROGRESS", {"Stage=BUILD mode requested"})
    main:SetMode("BUILD", false, "FIXLGS smoke")
    return
  end
  if _G.FIXLGS_smokeStage ~= "build-requested" then return end
  local build = main.modes and main.modes["BUILD"]
  if not build then error("BUILD mode not found after SetMode") end
  if not build.calcsTab then error("BUILD calcsTab missing after frame") end
  if type(build.calcsTab.BuildOutput) ~= "function" then error("BuildOutput is not a function after BUILD initialization") end
  -- The ordinary BUILD frame performs calculations. Rebuild explicitly as a consistency check.
  if build.configTab and type(build.configTab.BuildModList) == "function" then
    build.configTab:BuildModList()
  end
  build.calcsTab:BuildOutput()
  local output = build.calcsTab.mainOutput
  if type(output) ~= "table" then error("mainOutput is not available") end
  local function numberOrNil(key)
    local val = output[key]
    return key .. "=" .. (type(val) == "number" and tostring(val) or "nil")
  end
  local keys = 0
  for _ in pairs(output) do keys = keys + 1 end
  finish("FIXLGS_POB2_READY", {
    "Stage=BUILD frame completed", "OutputKeys=" .. keys,
    numberOrNil("Life"),numberOrNil("Mana"),numberOrNil("EnergyShield"),
    numberOrNil("TotalDPS"),numberOrNil("CombinedDPS")
  })
end)
if not ok then finish("FIXLGS_POB2_ERROR", {"Stage=" .. tostring(_G.FIXLGS_smokeStage or "start"),"Message=" .. tostring(err)}) end
