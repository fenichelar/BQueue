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
try {
  const response = await queue.pushMessage(message);
  console.log('Message ID: ' + response.id);
} catch (err) {
  console.error(err);
}
```

### Grab and process a batch of messages from the queue

Randomly selects a queue and grabs up to `maxBatchSize` messages from it. Redis blocks during the reading of all of the messages in the batch so limit `maxBatchSize` to the smallest amount needed for your batch operation. Don't forget to remove the messages from the queue after processing has completed. `processingTimeout` is the number of milliseconds expected for processing. If the messages have not been removed after this time, they will eventually be reinserted to the queue for future processing. Due to the distributed nature of the queue, this function can only return items on one particular queue. It should be called frequently to ensure quick processing of messages across all of the queues.

```javascript
const maxBatchSize = 1000;
const processingTimeout = 300000;
try {
  const batch = await queue.getBatch(maxBatchSize, processingTimeout);
  batch.messages.forEach(message => {
    console.log('Message ID: ' + message.id);
    console.log('Message Contents: ' + message.message);
  });
  await batch.remove();
} catch (err) {
  console.error(err);
}
```

### Reinsert unprocessed messages into the queue

Randomly selects a queue and reinserts unprocessed messages back into it for future processing. Due to the distributed nature of the queue, this function should be called frequently to ensure failed messages are retried.

```javascript
const maxMessages = 1000;
try {
  const response = await queue.reinsertUnprocessed(maxMessages);
  console.log('Unprocessed Message IDs: ' + response.ids.join(','));
} catch (err) {
  console.error(err);
}
```
