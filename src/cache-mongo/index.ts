import express from 'express';
import { config } from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import { createClient } from 'redis';
import { join } from 'path';


config({ path: join(process.cwd(), ".env") });
const app = express();
const MONGO_URL: string = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST_PATH}`;
const REDIS_URL: string = `redis://default@${process.env.REDIS_HOST_PATH}`;

const mongoClient = new MongoClient(MONGO_URL);
const redisClient = createClient({ url: REDIS_URL });

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

async function getDataFromMongo(id: string) {
    const startTime = Date.now();
    const collection = mongoClient.db('test').collection('users');
    const result = await collection.findOne({ _id: ObjectId.createFromHexString(id) });
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`(${timeTaken}ms) Data retrieved from MongoDB: ${JSON.stringify(result)}`);
    return result;
}

async function getDataFromRedis(id: string) {
    const startTime = Date.now();
    const cachedData = await redisClient.get(`user-data:${id}`); // Use a consistent key prefix
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    if (cachedData) {
        console.log(`(${timeTaken}ms) Data retrieved from Redis cache: ${JSON.stringify(cachedData)}`);
        return JSON.parse(cachedData); // Parse cached data if necessary
    } else {
        // If not found in cache, fetch from MongoDB and update cache
        const data = await getDataFromMongo(id);
        await redisClient.set(`user-data:${id}`, JSON.stringify(data), {expiration: {type: 'EX', value: 60} }); // Cache for 60 seconds
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
