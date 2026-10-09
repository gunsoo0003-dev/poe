-- FIXLGS V185: load a real PoB2 XML build; execute only in local SimpleGraphic runtime.
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
    main:SetMode("BUILD", false, "FIXLGS character test")
    return
  end
  if _G.FIXLGS_smokeStage == "build-requested" then
    local build = main.modes and main.modes["BUILD"]
    if not build then error("BUILD unavailable") end
    local file, openError = io.open(scriptPath .. "/FIXLGS_Character.xml", "rb")
    if not file then error("Character XML missing: " .. tostring(openError)) end
    local xmlText = file:read("*a"); file:close()
    if not xmlText:find("<PathOfBuilding", 1, true) then error("Invalid PoB XML") end
    write("FIXLGS_POB2_PROGRESS", {"Stage=loading imported build", "XmlBytes=" .. #xmlText})
    -- Official ImportTab.lua uses Shutdown() + Init(false, name, imported XML, false).
    build:Shutdown()
    build:Init(false, "FIXLGS imported character", xmlText, false)
    _G.FIXLGS_smokeStage = "character-loaded"
    return  -- Let the imported build process its first full frame.
  end
  if _G.FIXLGS_smokeStage ~= "character-loaded" then return end
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
    "Stage=IMPORTED BUILD frame completed", "OutputKeys=" .. keys,
    numberOrNil("Life"),numberOrNil("Mana"),numberOrNil("EnergyShield"),
    numberOrNil("TotalDPS"),numberOrNil("CombinedDPS"),
    "BuildName=" .. tostring(build.buildName), "CharacterLevel=" .. tostring(build.characterLevel or build.level or "unavailable")
  })
end)
if not ok then finish("FIXLGS_POB2_ERROR", {"Stage=" .. tostring(_G.FIXLGS_smokeStage or "start"),"Message=" .. tostring(err)}) end
