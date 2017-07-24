local queue = KEYS[1]
local size = tonumber(ARGV[1])
local timeout = tonumber(ARGV[2])
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local messages = {}
while size > 0 do
  size = size - 1
  local id = redis.call('RPOPLPUSH', queueKey, processingKey)
  if not id then return messages end
  local messageKey = queueKey .. ':' .. id
  local messageProcessingKey = messageKey .. ':processing'
  local message = redis.call('GET', messageKey)
  table.insert(messages, message)
  redis.call('PSETEX', messageProcessingKey, timeout, 1)
end
return messages