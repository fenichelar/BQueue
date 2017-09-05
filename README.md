# BQueue

A simple library for reliable, distributed batch message processing using Redis. Distributes the queue across multiple Redis instances in a cluster for virtually limitless scaling.

### Requirements

An [ioredis](https://github.com/luin/ioredis) (or ioredis API compatible) instance must be passed to BQueue on initialization.

### Install

```javascript
npm install bqueue
```

### Initialize

For distributing the queue across multiple Redis instances, use a `queueCount` greater than 1.

```javascript
const ioredis = require('ioredis');
const bqueue = require('bqueue');
const queueName = 'queue';
const queueCount = 10;
let redisClient = new ioredis();
let queue = new bqueue(redisClient, queueName, queueCount);
```

### Add a message to the queue

A message can be anything: a string, number, function, object, etc. A message is randomly assigned to a single queue.

```javascript
const message = 'Test Message';
queue.pushMessage(message)
.then(response => {
  console.log('Message ID: ' + response.id);
})
.catch(err => {
  console.error(err);
});
```

### Grab and process a batch of messages from the queue

Randomly selects a queue and grabs up to `maxBatchSize` messages from it. Due to the distributed nature of the queue, this function can only return items on one particular queue. So it should be called very frequently to ensure quick processing of messages across all of the queues. `processingTimeout` is the number of milliseconds expected for processing. If the messages have not been removed after this time, they will eventually be reinserted to the queue for future processing.

```javascript
const maxBatchSize = 1000;
const processingTimeout = 300000; // 5 Minutes
queue.getBatch(maxBatchSize, processingTimeout)
.then(batch => {
  // Process batch of messages here
  batch.messages.forEach(message => {
    console.log('Message ID: ' + message.id);
    console.log('Message Contents: ' + message.message);
  });
  // Finished processing messages
  batch.remove()
  .then(ids => {
    console.log('Finished Processing Message IDs: ' + ids.join(','));
  })
  .catch(err => {
    console.error(err);
  });
})
.catch(err => {
  console.error(err);
});
```

### Reinsert unprocessed messages into the queue

Randomly selects a queue and reinserts unprocessed messages back into it for future processing. Due to the distributed nature of the queue, this function should be called frequently to ensure failed messages are retried.

```javascript
const maxMessages = 1000;
queue.reinsertUnprocessed(maxMessages)
.then(response => {
  console.log('Unprocessed Message IDs: ' + response.ids.join(','));
})
.catch(err => {
  console.error(err);
});
```
