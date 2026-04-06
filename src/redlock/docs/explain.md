# Distributed Lock with Redis (Redlock)

In this example, we have a simple product purchase system where multiple instances of the same application are running concurrently, all sharing the same MongoDB state data. This mimics real-world scenario where multiple nodes are accessing the same data. Each instance has an endpoint to check the stock of a product and an endpoint to buy the product (which decrements the stock by 1). Initially, the stock is set to 10. If we send 10 concurrent `/buy` requests, we can see that `redlock` is acquired by one instance at a time, ensuring that the stock is decremented correctly without any race conditions. This way, we can maintain the consistency of the stock value across all instances, even under high concurrency.

## Terminal 0 — start Redis
```bash
docker-compose up
```

## Terminal 1 — instance `A` on port `3001`
```bash
INSTANCE=A PORT=3001 npm run start:redlock
```

## Terminal 2 — instance `B` on port `3002`
```bash
INSTANCE=B PORT=3002 npm run start:redlock
```

## Terminal 3 — instance `C` on port `3003`
```bash
INSTANCE=C PORT=3003 npm run start:redlock
```

## Terminal 4 — simulate concurrent purchases
Run `simulate.sh` script with the product ID as an argument. You can find the product ID in the MongoDB database after inserting a sample product with stock 10. For example, if the product ID is `69d1bab2fa75b9259b06d213`, run:

```bash
sh src/redlock/simulate.sh 69d1bab2fa75b9259b06d213
```

This will send 10 concurrent `/buy` requests to random instances (`A`, `B`, or `C`), all trying to buy the same product.

# Output

Now, we have 3 instances of the same app running, all sharing the same MongoDB database. Each instance has an endpoint to check the stock of a product and an endpoint to buy the product (which decrements the stock by 1). Initially, the stock is set to 10. If we send 10 concurrent `/buy` requests, we can see that `redlock` is acquired by one instance at a time, ensuring that the stock is decremented correctly without any race conditions. This way, we can maintain the consistency of the stock value across all instances, even under high concurrency.

## Simulated Output
```
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "A"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "B"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "C"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "B"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "C"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "C"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "B"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "B"
}
{
  "error": "Server busy because resource is locked, try again.",
  "instance": "B"
}
{
  "message": "Purchase successful",
  "stock": 9,
  "instance": "A"
}
```

## Instance `A`
```
[A] Attempting to acquire lock...
[A] Attempting to acquire lock...
[A] Lock acquired ✅
[A] Lock denied ❌
[A] Stock decremented → 9
```

## Instance `B`
```
[B] Attempting to acquire lock...
[B] Attempting to acquire lock...
[B] Attempting to acquire lock...
[B] Attempting to acquire lock...
[B] Lock denied ❌
[B] Lock denied ❌
[B] Attempting to acquire lock...
[B] Lock denied ❌
[B] Lock denied ❌
[B] Lock denied ❌
```

## Instance `C`
```
[C] Attempting to acquire lock...
[C] Attempting to acquire lock...
[C] Attempting to acquire lock...
[C] Lock denied ❌
[C] Lock denied ❌
[C] Lock denied ❌
```
