//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_05_issues_have_a_path::{parse_order, parse_order_plain, summary};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    plain: Option<String>,
    rust: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        assert_eq!(parse_order_plain(&case.text).err(), case.plain, "{}", case.why);
        assert_eq!(parse_order(&case.text).err(), case.rust, "{}", case.why);
    }
}

#[test]
fn an_order_taken_is_summed() {
    let order = parse_order(r#"{"customer":{"name":"Ada","email":"ada@example.com"},"items":[{"sku":"A1","qty":2},{"sku":"B2","qty":1}]}"#).unwrap();
    assert_eq!(summary(&order), "Ada ordered 3");
}
