import express from 'express';
import { config } from 'dotenv';
import { createClient } from 'redis';
import { MongoClient, ObjectId } from 'mongodb';
import { join } from 'path';
import { createRedlock, NodeRedisAdapter } from 'redlock-universal';

config({ path: join(process.cwd(), ".env") });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const INSTANCE = process.env.INSTANCE || 'A';
const MONGO_URL: string = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST_PATH}`;
const REDIS_URL: string = `redis://default@${process.env.REDIS_HOST_PATH}`;

const mongodb = new MongoClient(MONGO_URL);
const redis = createClient({ url: REDIS_URL });
const redlock = createRedlock({
    adapters: [new NodeRedisAdapter(redis)],
    key: 'lock:stock',
    ttl: 25000,
    retryAttempts: 0
});

async function connectToMongo() {
    try {
        await mongodb.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

async function connectToRedis() {
    try {
        await redis.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
        process.exit(1);
    }
}


app.get('/:id/stock', async (req, res) => {
    const { id } = req.params;
    const products = mongodb.db('test').collection('products');
    const product = await products.findOne({ _id: ObjectId.createFromHexString(id) });
    res.json({ instance: INSTANCE, stock: product?.stock });
});


app.post('/:id/buy', async (req, res) => {
    console.log(`[${INSTANCE}] Attempting to acquire lock...`);

    try {
        await redlock.using(async () => {
            console.log(`[${INSTANCE}] Lock acquired ✅`);
            // simulate slow DB work
            await new Promise(r => setTimeout(r, 30000));

            const { id } = req.params;
            const products = mongodb.db('test').collection('products');
            const product = await products.findOne({ _id: ObjectId.createFromHexString(id) });

            if (product?.stock <= 0) {
                return res.status(400).json({ error: 'Out of stock', instance: INSTANCE });
            }

            const updatedStock = product?.stock - 1;
            products.updateOne({ _id: ObjectId.createFromHexString(id) }, {
                $set: { stock: updatedStock }
            });
            console.log(`[${INSTANCE}] Stock decremented → ${updatedStock}`);
            res.json({ message: 'Purchase successful', stock: updatedStock, instance: INSTANCE });
        });
    } catch (err) {
        console.warn(`[${INSTANCE}] Lock denied ❌`);
        res.status(423).json({ error: 'Server busy because resource is locked, try again.', instance: INSTANCE });
    }
});


(async () => {
    await connectToMongo();
    await connectToRedis();
    app.listen(PORT, () => console.log(`Instance ${INSTANCE} running on ${PORT}`));
})();
