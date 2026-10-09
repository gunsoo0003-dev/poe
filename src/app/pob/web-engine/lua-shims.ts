/**
 * Lua compatibility shims for running LuaJIT-targeted PoB code in Lua 5.2.
 *
 * These are injected via bridge_exec() before loading HeadlessWrapper.
 */

/**
 * `bit` module shim: LuaJIT's bit library → Lua 5.2's bit32.
 *
 * Key differences:
 * - LuaJIT `bit` returns signed 32-bit values
 * - Lua 5.2 `bit32` returns unsigned 32-bit values
 * - `bit.tobit(x)` normalizes to signed 32-bit (no direct bit32 equivalent)
 * - `bit.bswap`, `bit.tohex` have no bit32 equivalents
 */
export const BIT_SHIM = `
bit = {}
bit.band = bit32.band
bit.bor = bit32.bor
bit.bxor = bit32.bxor
bit.lshift = bit32.lshift
bit.rshift = bit32.rshift
bit.arshift = bit32.arshift
bit.bnot = bit32.bnot

function bit.tobit(x)
  x = x % 4294967296  -- 2^32
  if x >= 2147483648 then  -- 2^31
    x = x - 4294967296
  end
  return x
end

function bit.bswap(x)
  x = bit32.band(x, 0xFFFFFFFF)
  local b0 = bit32.band(x, 0xFF)
  local b1 = bit32.band(bit32.rshift(x, 8), 0xFF)
  local b2 = bit32.band(bit32.rshift(x, 16), 0xFF)
  local b3 = bit32.band(bit32.rshift(x, 24), 0xFF)
  return bit.tobit(b0 * 16777216 + b1 * 65536 + b2 * 256 + b3)
end

function bit.tohex(x, n)
  n = n or 8
  if n < 0 then
    return string.format("%0" .. (-n) .. "X", bit32.band(x, 0xFFFFFFFF))
  end
  return string.format("%0" .. n .. "x", bit32.band(x, 0xFFFFFFFF))
end

function bit.rol(x, n)
  return bit32.lrotate(x, n)
end

function bit.ror(x, n)
  return bit32.rrotate(x, n)
end
`;

/**
 * `jit` global stub so Launch.lua line 17 doesn't crash:
 *   jit.opt.start('maxtrace=4000','maxmcode=8192')
 *
 * Also set `arg` to an empty table (Lua CLI sets this, but WASM doesn't).
 */
export const JIT_SHIM = `
jit = { opt = { start = function() end }, version = "pob-web" }
arg = {}
`;

/**
 * `lua-utf8` stub for Modules/Common.lua.
 *
 * Used for: utf8.reverse, utf8.gsub, utf8.find, utf8.sub, utf8.match, utf8.next
 * These are only used for number formatting with thousands separators,
 * which only involves ASCII digits. So we delegate to string functions.
 */
export const UTF8_SHIM = `
do
  local utf8mod = {}
  utf8mod.reverse = string.reverse
  utf8mod.gsub = string.gsub
  utf8mod.find = string.find
  utf8mod.sub = string.sub
  utf8mod.match = string.match
  utf8mod.len = string.len
  utf8mod.byte = string.byte
  utf8mod.char = string.char
  utf8mod.gmatch = string.gmatch
  utf8mod.format = string.format
  utf8mod.rep = string.rep
  utf8mod.lower = string.lower
  utf8mod.upper = string.upper
  function utf8mod.next(s, i, step)
    step = step or 1
    if step > 0 then
      local pos = i
      for _ = 1, step do
        if pos > #s then return nil end
        pos = pos + 1
      end
      return pos
    else
      local pos = i
      for _ = 1, -step do
        if pos <= 0 then return nil end
        pos = pos - 1
      end
      return pos
    end
  end
  package.preload["lua-utf8"] = function() return utf8mod end
end
`;

/**
 * Lua 5.1 / LuaJIT `string.gsub` replacement-string semantics.
 *
 * PoB targets LuaJIT. In Lua 5.1 a '%' followed by a non-digit in a
 * REPLACEMENT string is emitted as that bare character; Lua 5.2 instead raises
 * "invalid use of '%' in replacement string". TradeHelpers.lua builds
 * replacements containing "%+" and "%?" (it is assembling a pattern), which is
 * fine on LuaJIT but fatal for us — and since ImportTab requires TradeHelpers,
 * it took down Build:Init entirely (no tabs created at all).
 *
 * We pre-normalise string replacements the way 5.1 would: "%%" and "%<digit>"
 * keep their meaning, any other "%x" collapses to "x".
 */
export const GSUB_COMPAT_SHIM = `
do
  local rawgsub = string.gsub
  local function normalizeRepl(repl)
    if not string.find(repl, "%%", 1, true) then return repl end
    local out, i, n = {}, 1, #repl
    while i <= n do
      local c = string.sub(repl, i, i)
      if c == "%" then
        local nxt = string.sub(repl, i + 1, i + 1)
        if nxt == "" then
          -- trailing '%' : Lua 5.1 emits nothing further
          out[#out + 1] = "%%"
          i = i + 1
        elseif nxt == "%" or string.match(nxt, "%d") then
          out[#out + 1] = c .. nxt
          i = i + 2
        else
          -- 5.1 behaviour: drop the '%', keep the character literally.
          -- Escape it if it is itself special in a replacement.
          out[#out + 1] = (nxt == "%") and "%%" or nxt
          i = i + 2
        end
      else
        out[#out + 1] = c
        i = i + 1
      end
    end
    return table.concat(out)
  end
  local function compatgsub(s, pat, repl, n)
    if type(repl) == "string" then
      return rawgsub(s, pat, normalizeRepl(repl), n)
    end
    return rawgsub(s, pat, repl, n)
  end
  string.gsub = compatgsub
  -- keep the string metatable's method table in sync (s:gsub(...))
  local mt = getmetatable("")
  if mt and mt.__index and mt.__index ~= string then
    mt.__index.gsub = compatgsub
  end
end
`;

/**
 * All shims combined, in the order they must be applied.
 */
// GSUB_COMPAT before UTF8 so lua-utf8's delegated gsub is the compat version.
export const ALL_SHIMS = JIT_SHIM + BIT_SHIM + GSUB_COMPAT_SHIM + UTF8_SHIM;
