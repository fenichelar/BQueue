const uuid = require('uuid');
const lua = require('./lua.json');

function BQueue(redisClient, queueName = 'bqueue', queueCount = 1) {
  if (typeof queueName !== 'string') {
    throw new Error('Queue name must be a string!');
  } else if (!Number.isInteger(queueCount)) {
    throw new Error('Queue count must be an integer!');
  } else if (queueCount < 1 || queueCount > 1000) {
    throw new Error('Queue count must be between 1 and 1000!');
  }

  this.redisClient = redisClient;
  this.queueName = queueName;
  this.queueCount = queueCount;

  this.redisClient.defineCommand('pushMessage', {
    numberOfKeys: 1,
    lua: lua.pushMessage
  });
  this.redisClient.defineCommand('getBatch', {
    numberOfKeys: 1,
    lua: lua.getBatch
  });
  this.redisClient.defineCommand('removeMessages', {
    numberOfKeys: 1,
    lua: lua.removeMessages
  });
  this.redisClient.defineCommand('reinsertUnprocessed', {
    numberOfKeys: 1,
    lua: lua.reinsertUnprocessed
  });
}

BQueue.prototype.pushMessage = function(message = '') {
  return new Promise((resolve, reject) => {
    const queueNumber = Math.floor(Math.random() * this.queueCount);
    const queue = this.queueName + ':' + queueNumber;
    const id = uuid.v4();
    this.redisClient.pushMessage(queue, id, JSON.stringify({id, message}), (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
};

BQueue.prototype.getBatch = function(maxBatchSize = 1, processingTimeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(maxBatchSize)) {
      return reject(Error('Max batch size must be an integer!'));
    } else if (maxBatchSize < 1 || maxBatchSize > 10000) {
      return reject(Error('Max batch sizee must be between 1 and 10000!'));
    } else if (!Number.isInteger(processingTimeout)) {
      return reject(Error('Processing timeout must be an integer!'));
    } else if (processingTimeout < 1000 || processingTimeout > 604800000) {
      return reject(Error('Processing timeout must be between 1000 and 604800000!'));
    }
    const queueNumber = Math.floor(Math.random() * this.queueCount);
    const queue = this.queueName + ':' + queueNumber;
    this.redisClient.getBatch(queue, maxBatchSize, processingTimeout, (err, results) => {
      if (err) {
        return reject(err);
      } else {
        const messages = results.map(value => JSON.parse(value));
        return resolve({
          name: this.queueName,
          number: queueNumber,
          messages: messages,
          remove: () => {
            return new Promise((resolve, reject) => {
              const ids = messages.filter(message => message).map(message => message.id);
              this.redisClient.removeMessages(queue, ...ids, (err, results) => {
                if (err) {
                  return reject(err);
                } else {
                  return resolve(results);
                }
              });
            });
          }
        });
      }
    });
  });
};

BQueue.prototype.reinsertUnprocessed = function(maxMessages = 1000) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(maxMessages)) {
      return reject(Error('Max messages must be an integer!'));
    } else if (maxMessages < 1 || maxMessages > 10000) {
      return reject(Error('Max messages must be between 1 and 10000!'));
    }
    const queueNumber = Math.floor(Math.random() * this.queueCount);
    const queue = this.queueName + ':' + queueNumber;
    this.redisClient.reinsertUnprocessed(queue, maxMessages, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve({
          name: this.queueName,
          number: queueNumber,
          ids: result
        });
      }
    });
  });
};

module.exports = BQueue;
