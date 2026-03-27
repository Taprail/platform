use rand::Rng;

/// Encrypts card data into ISW authData format.
///
/// Format: `1Z{pan}Z{pin}Z{expiryDate}Z{cvv}` encrypted with RSA/ECB/PKCS1Padding,
/// then base64 encoded.
///
/// `modulus` and `exponent` are hex-encoded strings provided by Interswitch.
pub fn encrypt_auth_data(
    pan: &str,
    pin: &str,
    expiry_date: &str,
    cvv: &str,
    modulus_hex: &str,
    exponent_hex: &str,
) -> Result<String, String> {
    if modulus_hex.is_empty() {
        return Err("ISW RSA modulus not configured. Request it from ipg@interswitchgroup.com".into());
    }

    let plaintext = format!("1Z{}Z{}Z{}Z{}", pan, pin, expiry_date, cvv);

    let n = hex_to_bigint(modulus_hex)?;
    let e = hex_to_bigint(exponent_hex)?;
    let k = byte_length(&n);

    if k == 0 {
        return Err("Invalid RSA modulus".into());
    }

    let padded = pkcs1_v15_pad(plaintext.as_bytes(), k)?;

    let m = bytes_to_bigint(&padded);
    let c = mod_pow(&m, &e, &n);
    let encrypted = bigint_to_bytes(&c, k);

    Ok(base64_encode(&encrypted))
}

// ---------------------------------------------------------------------------
// Minimal big-integer arithmetic (no external crate needed)
// We represent big integers as Vec<u32> in little-endian limb order.
// ---------------------------------------------------------------------------

type BigInt = Vec<u32>;

fn hex_to_bigint(hex: &str) -> Result<BigInt, String> {
    let hex = hex.trim_start_matches("0x").trim_start_matches("0X");
    let bytes = hex_decode(hex)?;
    Ok(bytes_to_bigint(&bytes))
}

fn bytes_to_bigint(bytes: &[u8]) -> BigInt {
    let mut limbs = Vec::new();
    let mut i = bytes.len();
    while i > 0 {
        let start = if i >= 4 { i - 4 } else { 0 };
        let mut val: u32 = 0;
        for &b in &bytes[start..i] {
            val = (val << 8) | b as u32;
        }
        limbs.push(val);
        i = start;
    }
    normalize(&mut limbs);
    limbs
}

fn bigint_to_bytes(n: &BigInt, size: usize) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(size);
    for limb in n.iter().rev() {
        bytes.push((*limb >> 24) as u8);
        bytes.push((*limb >> 16) as u8);
        bytes.push((*limb >> 8) as u8);
        bytes.push(*limb as u8);
    }
    // Strip leading zeros, then pad to `size`
    let start = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
    let meaningful = &bytes[start..];
    if meaningful.len() >= size {
        meaningful[meaningful.len() - size..].to_vec()
    } else {
        let mut result = vec![0u8; size - meaningful.len()];
        result.extend_from_slice(meaningful);
        result
    }
}

fn byte_length(n: &BigInt) -> usize {
    if n.is_empty() {
        return 0;
    }
    let top = n.len() - 1;
    let top_bits = 32 - n[top].leading_zeros() as usize;
    (top * 32 + top_bits + 7) / 8
}

fn normalize(n: &mut BigInt) {
    while n.len() > 1 && *n.last().unwrap() == 0 {
        n.pop();
    }
}

// Modular exponentiation: base^exp mod modulus
fn mod_pow(base: &BigInt, exp: &BigInt, modulus: &BigInt) -> BigInt {
    let mut result = vec![1u32];
    let mut b = base.clone();
    let bits = bigint_bits(exp);

    for i in 0..bits {
        if bigint_bit(exp, i) {
            result = mod_mul(&result, &b, modulus);
        }
        b = mod_mul(&b, &b, modulus);
    }
    result
}

fn bigint_bits(n: &BigInt) -> usize {
    if n.is_empty() {
        return 0;
    }
    let top = n.len() - 1;
    top * 32 + (32 - n[top].leading_zeros() as usize)
}

fn bigint_bit(n: &BigInt, i: usize) -> bool {
    let limb = i / 32;
    let bit = i % 32;
    if limb >= n.len() {
        false
    } else {
        (n[limb] >> bit) & 1 == 1
    }
}

// Multiply two big integers and reduce mod m
fn mod_mul(a: &BigInt, b: &BigInt, m: &BigInt) -> BigInt {
    let product = bigint_mul(a, b);
    bigint_mod(&product, m)
}

fn bigint_mul(a: &BigInt, b: &BigInt) -> BigInt {
    let mut result = vec![0u32; a.len() + b.len()];
    for i in 0..a.len() {
        let mut carry: u64 = 0;
        for j in 0..b.len() {
            let prod = a[i] as u64 * b[j] as u64 + result[i + j] as u64 + carry;
            result[i + j] = prod as u32;
            carry = prod >> 32;
        }
        result[i + b.len()] += carry as u32;
    }
    normalize(&mut result);
    result
}

// Simple big integer modulo (schoolbook division)
fn bigint_mod(a: &BigInt, m: &BigInt) -> BigInt {
    if bigint_cmp(a, m) < 0 {
        return a.clone();
    }

    let mut remainder = a.clone();
    let m_bits = bigint_bits(m);
    let a_bits = bigint_bits(&remainder);

    if m_bits == 0 {
        return vec![0];
    }

    let shift = if a_bits > m_bits { a_bits - m_bits } else { 0 };
    let mut shifted_m = bigint_shl(m, shift);

    for _ in 0..=shift {
        if bigint_cmp(&remainder, &shifted_m) >= 0 {
            remainder = bigint_sub(&remainder, &shifted_m);
        }
        shifted_m = bigint_shr1(&shifted_m);
    }

    normalize(&mut remainder);
    remainder
}

fn bigint_cmp(a: &BigInt, b: &BigInt) -> i32 {
    let al = a.len();
    let bl = b.len();
    if al != bl {
        return if al > bl { 1 } else { -1 };
    }
    for i in (0..al).rev() {
        if a[i] != b[i] {
            return if a[i] > b[i] { 1 } else { -1 };
        }
    }
    0
}

fn bigint_sub(a: &BigInt, b: &BigInt) -> BigInt {
    let mut result = a.clone();
    let mut borrow: i64 = 0;
    for i in 0..result.len() {
        let bv = if i < b.len() { b[i] as i64 } else { 0 };
        let diff = result[i] as i64 - bv - borrow;
        if diff < 0 {
            result[i] = (diff + (1i64 << 32)) as u32;
            borrow = 1;
        } else {
            result[i] = diff as u32;
            borrow = 0;
        }
    }
    normalize(&mut result);
    result
}

fn bigint_shl(n: &BigInt, bits: usize) -> BigInt {
    let limb_shift = bits / 32;
    let bit_shift = bits % 32;

    let mut result = vec![0u32; n.len() + limb_shift + 1];
    for i in 0..n.len() {
        let v = n[i] as u64;
        result[i + limb_shift] |= (v << bit_shift) as u32;
        if bit_shift > 0 {
            result[i + limb_shift + 1] |= (v >> (32 - bit_shift)) as u32;
        }
    }
    normalize(&mut result);
    result
}

fn bigint_shr1(n: &BigInt) -> BigInt {
    let mut result = n.clone();
    let mut carry = 0u32;
    for i in (0..result.len()).rev() {
        let new_carry = result[i] & 1;
        result[i] = (result[i] >> 1) | (carry << 31);
        carry = new_carry;
    }
    normalize(&mut result);
    result
}

// ---------------------------------------------------------------------------
// PKCS#1 v1.5 padding (type 2, for encryption)
// ---------------------------------------------------------------------------

fn pkcs1_v15_pad(message: &[u8], key_size: usize) -> Result<Vec<u8>, String> {
    if message.len() > key_size - 11 {
        return Err("Message too long for PKCS1 v1.5 padding".into());
    }

    let ps_len = key_size - message.len() - 3;
    let mut rng = rand::thread_rng();

    // Generate non-zero random padding bytes
    let mut ps = Vec::with_capacity(ps_len);
    while ps.len() < ps_len {
        let b: u8 = rng.gen();
        if b != 0 {
            ps.push(b);
        }
    }

    let mut padded = Vec::with_capacity(key_size);
    padded.push(0x00);
    padded.push(0x02);
    padded.extend_from_slice(&ps);
    padded.push(0x00);
    padded.extend_from_slice(message);

    Ok(padded)
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

fn hex_decode(hex: &str) -> Result<Vec<u8>, String> {
    if hex.len() % 2 != 0 {
        let padded = format!("0{}", hex);
        return hex_decode(&padded);
    }
    (0..hex.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&hex[i..i + 2], 16)
                .map_err(|_| format!("Invalid hex at position {}", i))
        })
        .collect()
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();

    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}
