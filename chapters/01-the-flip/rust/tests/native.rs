//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_01_the_flip::parse_user;
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let refusal = parse_user(&case.text).err();
        assert_eq!(refusal, case.rust, "{}", case.why);
    }
}
