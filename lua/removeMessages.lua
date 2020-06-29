local call = redis.call
local queue = KEYS[1]
local messages = ARGV
local queueKey = '{' .. queue .. '}:messages' .. ':'
local processingKey = '{' .. queue .. '}:processing'
for i = 1, #messages do
  local id = messages[i]
  local count = call('LREM', processingKey, -1, id)
  if count == 1 then
    local messageKey = queueKey .. id
    local messageProcessingKey = messageKey .. ':processing'
    call('DEL', messageKey, messageProcessingKey)
  end
end
return messages
