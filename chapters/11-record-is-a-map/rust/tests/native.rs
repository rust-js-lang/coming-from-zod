//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_11_record_is_a_map::{Stock, count, low, parse_stock, tagged, total};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
    summary: Option<String>,
}

/// What a page says of a shop's stock.
pub fn summary(stock: &Stock) -> String {
    format!(
        "{} in all, low: [{}], apples: {}, organic: {}",
        total(stock),
        low(stock, 5).join(", "),
        count(stock, "apple"),
        tagged(stock, "organic"),
    )
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let read = parse_stock(&case.text);
        assert_eq!(read.as_ref().err().cloned(), case.rust, "{}", case.why);
        assert_eq!(read.ok().map(|stock| summary(&stock)), case.summary, "{}", case.why);
    }
}
