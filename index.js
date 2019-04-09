const crypto = require('crypto');
const lua = require('./lua.json');

function uuid(placeholder) {
  if (placeholder) {
    return (placeholder ^ (crypto.randomBytes(1)[0] % 16) >> placeholder / 4).toString(16);
  } else {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
  }
}

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

BQueue.prototype.pushMessage = function(message = '', debug = false) {
  return new Promise((resolve, reject) => {
    const queueNumber = Math.floor(Math.random() * this.queueCount);
    const queue = this.queueName + ':' + queueNumber;
    const id = uuid();
    const record = JSON.stringify({
      id: id,
      message: message
    });
    const queueKey = '{' + queue + '}:messages';
    const messageKey = queueKey + ':' + id;
    if (debug) {
      console.log('set ' + messageKey + ' ' + record);
      console.log('lpush ' + queueKey + ' ' + id);
    }
    this.redisClient.multi().set(messageKey, record).lpush(queueKey, id).exec(err => {
      if (err) {
        return reject(err);
      } else {
        return resolve({
          name: this.queueName,
          number: queueNumber,
          id: id
        });
      }
    });
  });
};

BQueue.prototype.getBatch = function(maxBatchSize = 1, processingTimeout = 5000, debug = false) {
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
    if (debug) {
      console.log('getBatch ' + queue + ' ' + maxBatchSize + ' ' + processingTimeout);
    }
    this.redisClient.getBatch(queue, maxBatchSize, processingTimeout, (err, results) => {
      if (err) {
        return reject(err);
      } else {
        const messages = results.map(value => JSON.parse(value));
        return resolve({
          name: this.queueName,
          number: queueNumber,
          messages: messages,
          remove: (debug = false) => {
            return new Promise((resolve, reject) => {
              const ids = messages.filter(message => message).map(message => message.id);
              if (debug) {
                console.log('removeMessages ' + queue + ' ' + ids.join(' '));
              }
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

BQueue.prototype.reinsertUnprocessed = function(maxMessages = 1000, debug = false) {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(maxMessages)) {
      return reject(Error('Max messages must be an integer!'));
    } else if (maxMessages < 1 || maxMessages > 10000) {
      return reject(Error('Max messages must be between 1 and 10000!'));
    }
    const queueNumber = Math.floor(Math.random() * this.queueCount);
    const queue = this.queueName + ':' + queueNumber;
    if (debug) {
      console.log('reinsertUnprocessed ' + queue + ' ' + maxMessages);
    }
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
