local call = redis.call
local queue = KEYS[1]
local maxBatchSize = tonumber(ARGV[1])
local processingTimeout = tonumber(ARGV[2])
local queueKey = '{' .. queue .. '}:messages'
local processingKey = '{' .. queue .. '}:processing'
local messages = {}
for i = 1, maxBatchSize do
  local id = call('RPOPLPUSH', queueKey, processingKey)
  if not id then
    return messages
  end
  local messageKey = queueKey .. ':' .. id
  local messageProcessingKey = messageKey .. ':processing'
  local message = call('GET', messageKey)
  messages[#messages + 1] = message
  call('PSETEX', messageProcessingKey, processingTimeout, 1)
end
return messages
