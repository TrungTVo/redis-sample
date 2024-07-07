# Mongo & Redis Sample

## Start Mongo and Redis server

```
docker compose up
```

## Create sample `test` db and `users` collection

In Mongo DB, create `test` db and add new `users` collection. Then add a few sample user documents into it for testing purpose.

## Start application

```
npm start
```

Hit sample endpoint `/data/:id` with `id` taken from MongoDB of `_id` field

## Output

View that getting data from MongoDB takes more time than getting from Redis cache.

```
...
Connected to MongoDB
Connected to Redis
Server listening on port 3000

Data retrieved from MongoDB (id: 668afd93b6763198773b3926): 7ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 1ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 2ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 1ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 1ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 2ms
Data retrieved from Redis cache (id: 668afd93b6763198773b3926): 2ms
Data retrieved from MongoDB (id: 668afd15b6763198773b3925): 6ms
Data retrieved from Redis cache (id: 668afd15b6763198773b3925): 1ms
Data retrieved from Redis cache (id: 668afd15b6763198773b3925): 1ms
Data retrieved from Redis cache (id: 668afd15b6763198773b3925): 2ms
...
```
