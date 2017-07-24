# BQueue

A simple library for reliable, distributed batch message processing using Redis. Distributes the queue across multiple Redis instances in a cluster for virtually limitless scaling.

### Requirements

An [ioredis](https://github.com/luin/ioredis) (or ioredis API compatible) instance must be passed to BQueue on initialization.

### Install

```javascript
npm install bqueue
```

### Initialize

For distributing the queue accross multiple Redis instances, use a `queueCount` greater than 1.

```javascript
const ioredis = require('ioredis');
const bqueue = require('bqueue');
let redisClient = new ioredis();
const queueCount = 10;
let queue = new BQueue(redisClient, queueCount);
```

### Add a message to the queue

A message can be anything: a string, number, function, object, etc. A message is randomly assigned to a single queue.

```javascript
const message = 'Test Message';
queue.pushMessage(message)
.catch(err => {
  console.error(err);
})
.then(id => {
  console.log('Message ID: ' + id);
});
```

### Grab and process a batch of messages from the queue

Randomly selects a queue and grabs up to `batchSize` messages from it. Due to the distributed nature of the queue, this function can only return items on one particular queue. So it should be called very frequently to ensure quick processing of messages across all of the queues. `processingTimeout` is the number of milliseconds expected for processing. If the messages have not been removed after this time, they will eventually be reinserted to the queue for future processing.

```javascript
const batchSize = 100;
const processingTimeout = 60000; // 1 Minute
queue.getBatch(batchSize, processingTimeout)
.catch(err => {
  console.error(err);
})
.then(batch => {
  // Process batch of messages here
  batch.messages.forEach(message => {
    console.log('Message ID: ' + message.id);
    console.log('Message Contents: ' + message.message);
  });
  // Finished processing messages
  batch.remove()
  .catch(err => {
    console.error(err);
  })
  .then(ids => {
    console.log('Finished Processing Message IDs: ' + ids.join(','));
  });
});
```

### Reinsert unprocessed messages into the queue

Randomly selects a queue and reinserts unprocessed messages back into it for future processing. Due to the distributed nature of the queue, this function should be called frequently to ensure failed messages are retried.

```javascript
queue.reinsertUnprocessed()
.catch(err => {
  console.error(err);
})
.then(ids => {
  console.log('Unprocessed Message IDs: ' + ids.join(','));
});
```
