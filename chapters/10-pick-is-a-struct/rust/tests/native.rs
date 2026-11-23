//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_10_pick_is_a_struct::{User, apply, create, parse_new_user, parse_patch, public_json};
use serde::Deserialize;

#[derive(Deserialize)]
struct Case {
    kind: String,
    text: String,
    why: String,
    rust: Option<String>,
    user: Option<String>,
    public: Option<String>,
}

/// The user each patch is applied to.
pub fn ada() -> User {
    User { id: "u1".into(), name: "Ada".into(), email: "ada@example.com".into(), admin: false }
}

/// What a case makes: the user, or why not.
pub fn made(kind: &str, text: &str) -> Result<User, String> {
    match kind {
        "new" => parse_new_user(text).map(|new| create("u9", new)),
        _ => parse_patch(text).map(|patch| apply(&ada(), patch)),
    }
}

#[test]
fn native_rust_takes_and_refuses_each_case() {
    let cases: Vec<Case> = serde_json::from_str(include_str!("../../cases.json")).unwrap();
    for case in cases {
        let user = made(&case.kind, &case.text);
        assert_eq!(user.as_ref().err().cloned(), case.rust, "{}", case.why);
        assert_eq!(user.as_ref().ok().map(|u| serde_json::to_string(u).unwrap()), case.user, "{}", case.why);
        assert_eq!(user.ok().map(|u| public_json(&u)), case.public, "{}", case.why);
    }
}
