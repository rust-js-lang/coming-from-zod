//! Chapter 7: `z.enum` is an enum. A fieldless enum is a list of names; in
//! the JSON and in the JavaScript, each is its string.

use serde::Deserialize;

/// What a member may do, from least to most. The order the variants are
/// written in is their order: `derive(PartialOrd)` reads it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    #[cfg_attr(rust_js, rust_js::name = "viewer")]
    Viewer,
    #[cfg_attr(rust_js, rust_js::name = "editor")]
    Editor,
    #[cfg_attr(rust_js, rust_js::name = "admin")]
    Admin,
}

impl Role {
    /// Every role, in order: zod's `Role.options`, written out.
    pub const ALL: [Role; 3] = [Role::Viewer, Role::Editor, Role::Admin];
}

/// A member of a team.
#[derive(Debug, Deserialize)]
pub struct Member {
    pub name: String,
    pub role: Role,
}

/// Reads a `Member` out of JSON text, or says why it can't.
pub fn parse_member(text: &str) -> Result<Member, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Every role, for a picker.
pub fn roles() -> Vec<Role> {
    Role::ALL.to_vec()
}

/// A role's name, as the JSON has it.
pub fn role_name(role: Role) -> &'static str {
    match role {
        Role::Viewer => "viewer",
        Role::Editor => "editor",
        Role::Admin => "admin",
    }
}

/// Whether a role may change things.
pub fn can_edit(role: Role) -> bool {
    matches!(role, Role::Editor | Role::Admin)
}

/// Whether `role` is `min` or above it.
pub fn at_least(role: Role, min: Role) -> bool {
    role >= min
}
