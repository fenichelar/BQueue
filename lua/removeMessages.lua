local queue = KEYS[1]
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local ids = {}
for _, id in ipairs(ARGV) do
  table.insert(ids, id)
  local count = redis.call('LREM', processingKey, -1, id)
  if count == 1 then
    local messageKey = queueKey .. ':' .. id
    local messageProcessingKey = messageKey .. ':processing'
    redis.call('DEL', messageKey, messageProcessingKey)
  end
end
return ids
