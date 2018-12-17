local call = redis.call
local queue = KEYS[1]
local maxMessages = tonumber(ARGV[1])
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local processingMessages = call('LRANGE', processingKey, 0 - maxMessages, -1)
local ids = {}
for i = 1, #processingMessages do
  local id = processingMessages[i]
  local messageProcessingKey = queueKey .. ':' .. id .. ':processing'
  local stillProcessing = call('EXISTS', messageProcessingKey)
  if stillProcessing == 0 then
    ids[#ids + 1] = id
    call('RPUSH', queueKey, id)
    call('LREM', processingKey, -1, id)
  else
    return ids
  end
end
return ids
