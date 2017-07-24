local queue = KEYS[1]
local id = ARGV[1]
local message = ARGV[2]
local queueKey = '{' .. queue .. '}:messages'
local messageKey = queueKey .. ':' .. id
redis.call("LPUSH", queueKey, id)
redis.call("SET", messageKey, message)
return id