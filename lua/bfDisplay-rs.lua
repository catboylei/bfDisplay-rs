-- bfDisplay-rs 
-- sends and receives rpc requests from/to a compiled rust binary, to dynamically display the state
-- of the cells of a brainfuck program

-- add this file, as well as the binary to your .config/nvim/lua/ directory and add the following lines to
-- your init.lua: 

-- local bfDisplay = require("bfDisplay-rs")
-- bfDisplay.setup()

local AUTOSTART = true -- should the plugin autostart when opening a .bf
local DISPLAY_HEIGHT = 4 -- amount of horizontal lines in the display

local M = {}

local ns = vim.api.nvim_create_namespace("bfDisplay-rs")
local win_id = nil
local buf_id = nil
local job_id = nil
local script_dir = vim.fn.fnamemodify(debug.getinfo(1, "S").source:sub(2), ":h") -- why lua why
local pending_request = false
local warn_win_id = nil
local warn_buf_id = nil

local function get_or_create_win()
  if buf_id and vim.api.nvim_buf_is_valid(buf_id)
    and win_id and vim.api.nvim_win_is_valid(win_id) then
    vim.api.nvim_win_set_height(win_id, DISPLAY_HEIGHT)
    return win_id, buf_id
  end

  buf_id = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(buf_id, 'bufhidden', 'wipe')
  vim.api.nvim_buf_set_option(buf_id, 'filetype', 'bfDisplay')

  -- save current window to return focus to it
  local current_win = vim.api.nvim_get_current_win()

  win_id = vim.api.nvim_open_win(buf_id, false, {
    split = 'above',
    height = DISPLAY_HEIGHT,
  })

  vim.api.nvim_win_set_option(win_id, 'wrap', false)
  vim.api.nvim_win_set_option(win_id, 'number', false)
  vim.api.nvim_win_set_option(win_id, 'relativenumber', false)
  vim.api.nvim_win_set_option(win_id, 'signcolumn', 'no')
  vim.api.nvim_win_set_option(win_id, 'winfixheight', true)
  vim.api.nvim_buf_set_keymap(buf_id, 'n', '<ScrollWheelLeft>',  'zh', { noremap = true })
  vim.api.nvim_buf_set_keymap(buf_id, 'n', '<ScrollWheelRight>', 'zl', { noremap = true })

  -- return focus to the editing window
  vim.api.nvim_set_current_win(current_win)

  return win_id, buf_id
end

local function show_warning()
  if warn_win_id and vim.api.nvim_win_is_valid(warn_win_id) then return end
  local msg = "Warning: infinite loop detected"

  warn_buf_id = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_lines(warn_buf_id, 0, -1, false, { msg })

  warn_win_id = vim.api.nvim_open_win(warn_buf_id, false, {
    relative = 'editor',
    row = 2,
    col = math.floor((vim.o.columns - #msg) / 2),
    width = #msg,
    height = 1,
    style = 'minimal',
    border = 'rounded',
    zindex = 100,
  })
  vim.api.nvim_win_set_option(warn_win_id, 'winhl', 'Normal:WarningMsg')
end

local function hide_warning()
  if warn_win_id and vim.api.nvim_win_is_valid(warn_win_id) then
    vim.api.nvim_win_close(warn_win_id, true)
  end
  warn_win_id = nil
  warn_buf_id = nil
end

local function render(tape, ptr, warning)
  local cell_width = 7
  local cells_per_row = math.floor(vim.o.columns / cell_width)
  local total_cells = #tape

  local display_lines = {}

  local row = 0
  while row * cells_per_row < total_cells do
    local cell_nums = {}
    local cell_vals = {}
    local ptr_row   = {}

    for col = 0, cells_per_row - 1 do
      local i = row * cells_per_row + col
      if i >= total_cells then break end
      table.insert(cell_nums, string.format(" %4d ", i))
      table.insert(cell_vals, string.format(" %4d ", tape[i + 1] or 0))
      table.insert(ptr_row,   i == ptr and "  ^   " or "      ")
    end

    table.insert(display_lines, table.concat(cell_nums, "|"))
    table.insert(display_lines, table.concat(cell_vals, "|"))
    table.insert(display_lines, table.concat(ptr_row,   " "))
    table.insert(display_lines, "")

    row = row + 1
  end

  if warning then show_warning() else hide_warning() end

  local w, b = get_or_create_win()
  vim.api.nvim_buf_set_option(b, 'modifiable', true)
  vim.api.nvim_buf_set_lines(b, 0, -1, false, display_lines)
  vim.api.nvim_buf_set_option(b, 'modifiable', false)
  vim.api.nvim_buf_clear_namespace(b, ns, 0, -1)
end

function M._on_result(result)
  render(result["tape"], result["pointer"], result["warning"])
  pending_request = false
  --print("warning={}", result["warning"])
end

function M.start()
  job_id = vim.fn.jobstart(
  { script_dir .. "/bfDisplay" },
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
  vim.api.nvim_create_autocmd("BufWinLeave", {
    pattern = "*.bf",
    callback = function()
      vim.schedule(function()
        M.stop()
      end)
    end,
  })
  vim.api.nvim_create_autocmd("WinResized", {
  callback = function()
    if win_id and vim.api.nvim_win_is_valid(win_id) then
      vim.api.nvim_win_set_option(win_id, 'winfixheight', true)
      vim.api.nvim_win_set_height(win_id, DISPLAY_HEIGHT)
    end
  end,
  })
  print("Plugin started, job_id: " .. job_id)

  M.evaluate()
  vim.opt.mousescroll = "ver:4,hor:6"
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
  if win_id and vim.api.nvim_win_is_valid(win_id) then
    if #vim.api.nvim_list_wins() > 1 then
      vim.api.nvim_win_close(win_id, true)
    else
      vim.cmd('qa')
    end
  end
  win_id = nil
  buf_id = nil
end

function M.setup()
  vim.api.nvim_create_user_command("BfrsStart", function() M.start() end, {})
  vim.api.nvim_create_user_command("BfrsPing",  function() M.ping() end, {})
  vim.api.nvim_create_user_command("BfrsStop",  function() M.stop() end, {})
  if AUTOSTART then vim.api.nvim_create_autocmd("BufEnter", {
    pattern = "*.bf",
    callback = function()
      if job_id == nil then
        M.start()
      end
    end 
    })
  end
end

function M.evaluate()
  if job_id == nil then return end
  if pending_request then return end
  pending_request = true

  local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
  local code = table.concat(lines, "\n")
  local cursor = vim.api.nvim_win_get_cursor(0)

  vim.fn.rpcnotify(job_id, "evaluate", code, cursor)
end

return M