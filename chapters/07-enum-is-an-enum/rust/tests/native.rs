//! The chapter's cases, run by native Rust: what rust-js's JS must say too.

use chapter_07_enum_is_an_enum::{Role, at_least, can_edit, parse_member, role_name, roles};
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
        assert_eq!(parse_member(&case.text).err(), case.rust, "{}", case.why);
    }
}

#[test]
fn roles_are_in_order_and_named_as_the_json_names_them() {
    assert_eq!(roles(), [Role::Viewer, Role::Editor, Role::Admin]);
    let names: Vec<&str> = roles().into_iter().map(role_name).collect();
    assert_eq!(names, ["viewer", "editor", "admin"]);
    assert!(can_edit(Role::Admin) && can_edit(Role::Editor) && !can_edit(Role::Viewer));
    assert!(at_least(Role::Admin, Role::Editor) && at_least(Role::Editor, Role::Editor));
    assert!(!at_least(Role::Viewer, Role::Editor));
}
