use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

/// Simple in-memory token-bucket rate limiter.
/// Each key gets `capacity` tokens that refill at `refill_rate` tokens/sec.
pub struct RateLimiter {
    buckets: Mutex<HashMap<String, Bucket>>,
    capacity: u32,
    refill_rate: f64,
}

struct Bucket {
    tokens: f64,
    last_refill: Instant,
}

impl RateLimiter {
    pub fn new(capacity: u32, refill_rate: f64) -> Self {
        Self {
            buckets: Mutex::new(HashMap::new()),
            capacity,
            refill_rate,
        }
    }

    /// Returns Ok(remaining) if allowed, Err(retry_after_secs) if rate limited.
    pub fn check(&self, key: &str) -> Result<u32, f64> {
        let mut buckets = self.buckets.lock().unwrap();
        let now = Instant::now();
        let cap = self.capacity as f64;

        let bucket = buckets.entry(key.to_string()).or_insert(Bucket {
            tokens: cap,
            last_refill: now,
        });

        // Refill tokens
        let elapsed = now.duration_since(bucket.last_refill).as_secs_f64();
        bucket.tokens = (bucket.tokens + elapsed * self.refill_rate).min(cap);
        bucket.last_refill = now;

        if bucket.tokens >= 1.0 {
            bucket.tokens -= 1.0;
            Ok(bucket.tokens as u32)
        } else {
            let wait = (1.0 - bucket.tokens) / self.refill_rate;
            Err(wait)
        }
    }

    /// Periodically clean up stale entries (call from background task).
    pub fn cleanup(&self) {
        let mut buckets = self.buckets.lock().unwrap();
        let now = Instant::now();
        buckets.retain(|_, b| now.duration_since(b.last_refill).as_secs() < 300);
    }
}
