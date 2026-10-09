-- FIXLGS PoB2 headless smoke test.
-- This file is copied into PathOfBuilding-PoE2/src by setup-pob2-engine.ps1.

dofile("HeadlessWrapper.lua")

newBuild()

if build and build.configTab and build.configTab.BuildModList then
  build.configTab:BuildModList()
end
if build and build.calcsTab and build.calcsTab.BuildOutput then
  build.calcsTab:BuildOutput()
end

local output = build and build.calcsTab and build.calcsTab.mainOutput or {}

print("FIXLGS_POB2_READY")
print("Life=" .. tostring(output.Life or output.LifeUnreserved or "nil"))
print("Mana=" .. tostring(output.Mana or output.ManaUnreserved or "nil"))
print("EnergyShield=" .. tostring(output.EnergyShield or "nil"))
print("TotalDPS=" .. tostring(output.TotalDPS or output.CombinedDPS or "nil"))
