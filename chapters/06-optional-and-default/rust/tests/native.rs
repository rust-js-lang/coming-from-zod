//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_06_optional_and_default::{greeting, parse_profile};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
    greeting: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let read = parse_profile(&case.text);
        assert_eq!(read.as_ref().err().cloned(), case.rust, "{}", case.why);
        assert_eq!(read.ok().map(|profile| greeting(&profile)), case.greeting, "{}", case.why);
    }
}
