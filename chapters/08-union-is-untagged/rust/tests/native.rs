//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_08_union_is_untagged::{id_label, parse_person, reach};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
    said: Option<String>,
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let read = parse_person(&case.text);
        assert_eq!(read.as_ref().err().cloned(), case.rust, "{}", case.why);
        let said = read.ok().map(|person| format!("{}: {}", id_label(&person.id), reach(&person.contact)));
        assert_eq!(said, case.said, "{}", case.why);
    }
}
