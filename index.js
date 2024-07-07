const express = require('express');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const redis = require('redis');

const app = express();
const mongoUrl = 'mongodb://root:example@localhost:27017';
const redisUrl = 'redis://localhost:6379';

const mongoClient = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const redisClient = redis.createClient(redisUrl);

async function connectToMongo() {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

async function connectToRedis() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
        process.exit(1);
    }
}

async function getDataFromMongo(id) {
    const startTime = Date.now();
    const collection = mongoClient.db('test').collection('users');
    const result = await collection.findOne({ _id: ObjectId.createFromHexString(id) });
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Data retrieved from MongoDB (id: ${id}): ${timeTaken}ms`);
    return result;
}

async function getDataFromRedis(id) {
    const startTime = Date.now();
    const cachedData = await redisClient.get(`data:${id}`); // Use a consistent key prefix
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    if (cachedData) {
        console.log(`Data retrieved from Redis cache (id: ${id}): ${timeTaken}ms`);
        return JSON.parse(cachedData); // Parse cached data if necessary
    } else {
        // If not found in cache, fetch from MongoDB and update cache
        const data = await getDataFromMongo(id);
        await redisClient.set(`data:${id}`, JSON.stringify(data), 'EX', 60); // Cache for 60 seconds
        return data;
    }
}

app.get('/data/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const data = await getDataFromRedis(id);
        res.json(data);
    } catch (err) {
        console.error('Error retrieving data:', err);
        res.status(500).send('Error');
    }
});

(async () => {
    await connectToMongo();
    await connectToRedis();

    app.listen(3000, () => {
        console.log('Server listening on port 3000');
    });
})();
