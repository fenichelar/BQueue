local queue = KEYS[1]
local maxMessages = tonumber(ARGV[1])
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local processingMessages = redis.call('LRANGE', processingKey, 0 - maxMessages, -1)
local ids = {}
for _, id in ipairs(processingMessages) do
  local messageKey = queueKey .. ':' .. id
  local messageProcessingKey = messageKey .. ':processing'
  local stillProcessing = redis.call('EXISTS', messageProcessingKey)
  if stillProcessing == 0 then
    table.insert(ids, id)
    redis.call('LPUSH', queueKey, id)
    redis.call('LREM', processingKey, -1, id)
  end
end
return ids