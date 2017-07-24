const uuid = require('uuid');
const fs = require('fs');

const pushMessageScript = fs.readFileSync('lua/pushMessage.lua').toString();
const getBatchScript = fs.readFileSync('lua/getBatch.lua').toString();
const removeMessagesScript = fs.readFileSync('lua/removeMessages.lua').toString();
const reinsertUnprocessedScript = fs.readFileSync('lua/reinsertUnprocessed.lua').toString();

function BQueue(redisClient, queueCount = 1) {
  if (!Number.isInteger(queueCount)) {
    throw new Error('Queue count must be an integer!');
  } else if (queueCount < 1 || queueCount > 100) {
    throw new Error('Queue count must be between 1 and 100!');
  }

  this.redisClient = redisClient;
  this.queueCount = queueCount;

  this.redisClient.defineCommand('pushMessage', {
    numberOfKeys: 1,
    lua: pushMessageScript
  });
  this.redisClient.defineCommand('getBatch', {
    numberOfKeys: 1,
    lua: getBatchScript
  });
  this.redisClient.defineCommand('removeMessages', {
    numberOfKeys: 1,
    lua: removeMessagesScript
  });
  this.redisClient.defineCommand('reinsertUnprocessed', {
    numberOfKeys: 1,
    lua: reinsertUnprocessedScript
  });
}

BQueue.prototype.pushMessage = function(message = '') {
  return new Promise((resolve, reject) => {
    const queueNumber = Math.floor(Math.random()*this.queueCount);
    const queue = 'bqueue:' + queueNumber;
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

BQueue.prototype.getBatch = function(batchSize = 1, processingTimeout = 5000) {
  if (!Number.isInteger(batchSize)) {
    throw new Error('Batch size must be an integer!');
  } else if (batchSize < 1 || batchSize > 1000) {
    throw new Error('Batch batchSize must be between 1 and 1000!');
  } else if (!Number.isInteger(processingTimeout)) {
    throw new Error('Processing timeout must be an integer!');
  } else if (processingTimeout < 1000 || processingTimeout > 604800000) {
    throw new Error('Processing timeout must be between 1000 and 604800000!');
  }
  return new Promise((resolve, reject) => {
    const queueNumber = Math.floor(Math.random()*this.queueCount);
    const queue = 'bqueue:' + queueNumber;
    this.redisClient.getBatch(queue, batchSize, processingTimeout, (err, results) => {
      if (err) {
        return reject(err);
      } else {
        const messages = results.map(value => JSON.parse(value));
        return resolve({
          messages: messages,
          remove: () => {
            return new Promise((resolve, reject) => {
              const ids = messages.map(message => message.id);
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

BQueue.prototype.reinsertUnprocessed = function() {
  return new Promise((resolve, reject) => {
    const queueNumber = Math.floor(Math.random()*this.queueCount);
    const queue = 'bqueue:' + queueNumber;
    this.redisClient.reinsertUnprocessed(queue, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });
};

module.exports = BQueue;
