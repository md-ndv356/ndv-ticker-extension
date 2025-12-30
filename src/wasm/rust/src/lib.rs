use core::slice;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
  pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
  alert(&format!("Hello, {}!", name));
}

#[wasm_bindgen]
pub fn hypot(x: f64, y: f64) -> f64 {
  (x * x + y * y).sqrt()
}

#[wasm_bindgen]
pub fn quakemap_calc_magnification(point_ptr: *const i32, center_ptr: *const f64) -> f64 {
  // Safety: the caller is responsible for passing valid pointers into the wasm linear memory.
  if point_ptr.is_null() || center_ptr.is_null() {
    return 0.0;
  }

  let center = unsafe { slice::from_raw_parts(center_ptr, 2) };
  let mut current = 0.0_f64;
  let pref_size = unsafe { *point_ptr } as usize;

  for pref_idx in 0..pref_size {
    let count_idx = 1 + pref_idx * 2;
    let ptr_idx = count_idx + 1;

    let _pts_count = unsafe { *point_ptr.add(count_idx) }; // Reserved for parity with C++ version
    let pts_address = unsafe { *point_ptr.add(ptr_idx) } as *const f32;
    if pts_address.is_null() {
      continue;
    }

    let pts_len = unsafe { *pts_address } as usize;
    if pts_len == 0 {
      continue;
    }

    let coords = unsafe { slice::from_raw_parts(pts_address.add(1), pts_len * 2) };
    for chunk in coords.chunks_exact(2) {
      let distance = ((chunk[0] as f64 - center[0]).powi(2)
        + (chunk[1] as f64 - center[1]).powi(2))
        .sqrt();
      if distance > current {
        current = distance;
      }
    }
  }

  current
}
