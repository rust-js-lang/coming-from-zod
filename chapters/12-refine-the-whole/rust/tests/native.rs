//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_12_refine_the_whole::{confirmation, parse_booking};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
    confirmation: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let read = parse_booking(&case.text);
        assert_eq!(read.as_ref().err().cloned(), case.rust, "{}", case.why);
        assert_eq!(read.ok().map(|booking| confirmation(&booking)), case.confirmation, "{}", case.why);
    }
}
