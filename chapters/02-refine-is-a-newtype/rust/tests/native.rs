//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_02_refine_is_a_newtype::{parse_signup, welcome};
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
        let refusal = parse_signup(&case.text).err();
        assert_eq!(refusal, case.rust, "{}", case.why);
    }
}

#[test]
fn a_parsed_signup_is_welcomed() {
    let signup = parse_signup(r#"{"name":"Ada","email":"ada@example.com"}"#).unwrap();
    assert_eq!(welcome(&signup.name, &signup.email), "Welcome, Ada! We'll write to ada@example.com.");
}
