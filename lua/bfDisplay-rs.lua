-- bfDisplay-rs 
-- sends and receives rpc requests from/to a compiled rust binary, to dynamically display the state
-- of the cells of a brainfuck program

-- add this file, as well as the binary to your .config/nvim/lua/ directory and add the following line to your init.lua:

-- local bfDisplay = require("bfDisplay-rs").setup()

local M = {}

local ns = vim.api.nvim_create_namespace("bfDisplay-rs")
local win_id = nil
local buf_id = nil
local job_id = nil

local function get_or_create_win(num_cells, num_lines)
  local width = num_cells * 7 + 2
  local col = math.floor((vim.o.columns - width) / 2)

  if buf_id and vim.api.nvim_buf_is_valid(buf_id) and win_id and vim.api.nvim_win_is_valid(win_id) then
    vim.api.nvim_win_set_config(win_id, {
      relative = 'editor', row = 0, col = col,
      width = width, height = num_lines,
    })
    return win_id, buf_id
  end

  buf_id = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf_id, 'bufhidden', 'wipe')
  vim.api.nvim_buf_set_option(buf_id, 'filetype', 'bfDisplay')

  win_id = vim.api.nvim_open_win(buf_id, false, {
    relative = 'editor', row = 0, col = col,
    width = width, height = num_lines,
    style = 'minimal', border = 'rounded', zindex = 50,
  })
  vim.api.nvim_win_set_option(win_id, 'winhl',
    'Normal:NormalFloat,FloatBorder:FloatBorder')

  return win_id, buf_id
end

local function render(tape, ptr, warning)
  local max_show = 0
  for i, v in ipairs(tape) do
    if v ~= 0 then max_show = i end
  end
  max_show = math.max(max_show, ptr + 1) + 2  -- +1 because lua is 1-indexed, +2 for padding
  max_show = math.min(max_show, 16)

  local cell_nums = {}
  local cell_vals = {}
  local ptr_row   = {}

  for i = 0, max_show do
    table.insert(cell_nums, string.format(" %4d ", i))
    table.insert(cell_vals, string.format(" %4d ", tape[i + 1] or 0))  -- tape is 1-indexed in lua
    table.insert(ptr_row,   i == ptr and "  ^   " or "      ")
  end

  local display_lines = {
    table.concat(cell_nums, "|"),
    table.concat(cell_vals, "|"),
    table.concat(ptr_row,   " "),
  }

  if warning then
    local width = (max_show + 1) * 7 + 2
    local msg = "⚠  infinite loop detected"
    local padding = math.max(0, math.floor((width - #msg) / 2))
    table.insert(display_lines, string.rep(" ", padding) .. msg)
  end

  local w, b = get_or_create_win(max_show + 1, #display_lines)
  vim.api.nvim_buf_set_option(b, 'modifiable', true)
  vim.api.nvim_buf_set_lines(b, 0, -1, false, display_lines)
  vim.api.nvim_buf_set_option(b, 'modifiable', false)
  vim.api.nvim_buf_clear_namespace(b, ns, 0, -1)
end

function M._on_result(result)
  render(result["tape"], result["pointer"], result["warning"])
end

function M.start()
  job_id = vim.fn.jobstart(
  { "/home/lei/.config/nvim/lua/bfDisplay" },
  {
    rpc = true,
    env = { RUST_BACKTRACE = "full" },
    on_stderr = function(_, data)
      local f = io.open("/tmp/bfDisplay.log", "a")
      for _, line in ipairs(data) do
        if line ~= "" then
          f:write(line .. "\n")
        end
      end
      f:close()
    end,
    on_exit = function(_, code)
      print("Plugin exited with code: " .. code)
    end,
  }
  )
  vim.api.nvim_create_autocmd({ "CursorMoved", "CursorMovedI", "TextChanged", "TextChangedI" }, {
    pattern = "*.bf",
    callback = function()
      M.evaluate()
    end,
  })
  print("Plugin started, job_id: " .. job_id)

  vim.api.nvim_create_autocmd("User", {
    pattern = "bfDisplay_result",
    callback = function(ev)
      local tape    = ev.data["tape"]
      local ptr     = ev.data["pointer"]
      local warning = ev.data["warning"]
      render(tape, ptr, warning)
    end,
  })
  M.evaluate()
end

function M.ping()
  if job_id == nil then
    print("Plugin not started, call :bfrs-start first")
    return
  end
  local result = vim.fn.rpcrequest(job_id, "ping")
  print(result)
end

function M.stop()
  if job_id ~= nil then
    vim.fn.jobstop(job_id)
    job_id = nil
    print("Plugin stopped")
  end
end

function M.setup()
  vim.api.nvim_create_user_command("BfrsStart", function() M.start() end, {})
  vim.api.nvim_create_user_command("BfrsPing",  function() M.ping() end, {})
  vim.api.nvim_create_user_command("BfrsStop",  function() M.stop() end, {})
end

function M.evaluate()
  if job_id == nil then return end

  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  local code = table.concat(lines, "\n")
  local cursor = vim.api.nvim_win_get_cursor(0)

  vim.fn.rpcnotify(job_id, "evaluate", code, cursor)
end

return M