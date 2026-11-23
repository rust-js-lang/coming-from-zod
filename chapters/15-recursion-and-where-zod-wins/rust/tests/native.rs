//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_15_recursion_and_where_zod_wins::{Comment, authors, count, depth, parse_thread};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    text: String,
    why: String,
    rust: Option<String>,
    summary: Option<String>,
}

/// What a page says of a thread.
pub fn summary(thread: &Comment) -> String {
    format!("{} comments, {} deep, by {}", count(thread), depth(thread), authors(thread).join(", "))
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let read = parse_thread(&case.text);
        assert_eq!(read.as_ref().err().cloned(), case.rust, "{}", case.why);
        assert_eq!(read.ok().map(|thread| summary(&thread)), case.summary, "{}", case.why);
    }
}
