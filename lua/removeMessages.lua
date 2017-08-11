local queue = KEYS[1]
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local ids = {}
for _, id in ipairs(ARGV) do
  table.insert(ids, id)
  redis.call('LREM', processingKey, -1, id)
  local messageKey = queueKey .. ':' .. id
  local messageProcessingKey = messageKey .. ':processing'
  redis.call('DEL', messageKey, messageProcessingKey)
end
return ids