//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_04_extend_is_flatten::{byline, label, parse_post, parse_user};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    kind: String,
    text: String,
    why: String,
    rust: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let refusal = match case.kind.as_str() {
            "user" => parse_user(&case.text).err(),
            _ => parse_post(&case.text).err(),
        };
        assert_eq!(refusal, case.rust, "{}", case.why);
    }
}

#[test]
fn a_record_is_labelled_by_its_base() {
    let user = parse_user(r#"{"id":"u1","createdAt":"2026-11-23","name":"Ada","email":"ada@example.com"}"#).unwrap();
    let post = parse_post(r#"{"id":"p1","createdAt":"2026-11-24","title":"Hello","authorId":"u1"}"#).unwrap();
    assert_eq!(label(&user.base), "u1, created 2026-11-23");
    assert_eq!(byline(&post, &user), "Hello by Ada (p1, created 2026-11-24)");
}
