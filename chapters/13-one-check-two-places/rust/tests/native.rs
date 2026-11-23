//! The chapter's cases, answered by native Rust: what the server says, and
//! what rust-js's JS must say too.

use chapter_13_one_check_two_places::respond;
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    body: String,
    why: String,
    status: u16,
    rust: String,
}

#[test]
fn native_rust_answers_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        assert_eq!(respond(&case.body), (case.status, case.rust), "{}", case.why);
    }
}
