# Demonstrating concurrency race condition

In this example, we have a simple product purchase system where multiple instances of the same application are running concurrently, all sharing the same MongoDB state data. This mimics real-world scenario where multiple nodes are accessing the same data. Each instance has an endpoint to check the stock of a product and an endpoint to buy the product (which decrements the stock by 1). Initially, the stock is set to 10. If we send 10 concurrent `/buy` requests, we might see that the stock is not decremented correctly.

## Terminal 0 — start Redis
```bash
docker-compose up
```

## Terminal 1 — instance `A` on port `3001`
```bash
INSTANCE=A PORT=3001 npm run start:concurrency-race-condition
```

## Terminal 2 — instance `B` on port `3002`
```bash
INSTANCE=B PORT=3002 npm run start:concurrency-race-condition
```

## Terminal 3 — instance `C` on port `3003`
```bash
INSTANCE=C PORT=3003 npm run start:concurrency-race-condition
```

## Terminal 4 — simulate concurrent purchases
Run `simulate.sh` script with the product ID as an argument. You can find the product ID in the MongoDB database after inserting a sample product with stock 10. For example, if the product ID is `69d1bab2fa75b9259b06d213`, run:

```bash
sh src/concurrency-race-condition/simulate.sh 69d1bab2fa75b9259b06d213
```

This will send 10 concurrent `/buy` requests to random instances (`A`, `B`, or `C`), all trying to buy the same product.

# Output

Now, we have 3 instances of the same app running, all sharing the same MongoDB database. Each instance has an endpoint to check the stock of a product and an endpoint to buy the product (which decrements the stock by 1). Initially, the stock is set to 10. If we send 10 concurrent `/buy` requests, we might see that the stock is not decremented correctly. For example, we might see that the stock goes from 10 to 9, then back to 10, and so on, due to the race condition. This is because multiple instances are reading the stock value at the same time, and then writing back the decremented value without proper synchronization. As a result, some purchases might succeed even when the stock should have been depleted, leading to an inconsistent state.

## Instance `A`
```
[A] Stock decremented → 9
[A] Stock decremented → 9
[A] Stock decremented → 8
[A] Stock decremented → 8
```

## Instance `B`
```
[B] Stock decremented → 9
[B] Stock decremented → 8
[B] Stock decremented → 8
```

## Instance `C`
```
[C] Stock decremented → 9
[C] Stock decremented → 8
[C] Stock decremented → 8
```

# Solution

We can use distributed lock from Redis (Redlock) to resolve this issue.