//! Chapter 10: `.pick`, `.omit` and `.partial` are structs of their own.
//! Rust derives no types from types: each shape is written out, and the
//! compiler holds the code between them to every field.

use serde::{Deserialize, Serialize};

/// A user, as it's kept.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub admin: bool,
}

/// What a client sends to make a user: `User.omit({ id: true })`. The
/// server gives the id.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NewUser {
    pub name: String,
    pub email: String,
    #[serde(default)]
    pub admin: bool,
}

/// What a client sends to change a user: `.partial()`, each field it may
/// leave out, and no `id`, which can't change.
#[derive(Debug, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UserPatch {
    pub name: Option<String>,
    pub email: Option<String>,
    pub admin: Option<bool>,
}

/// What other users see: `User.pick({ id: true, name: true })`.
#[derive(Debug, Serialize)]
pub struct PublicUser {
    pub id: String,
    pub name: String,
}

/// A new user, given the id the server picked.
pub fn create(id: &str, new: NewUser) -> User {
    User { id: id.to_string(), name: new.name, email: new.email, admin: new.admin }
}

/// A user with a patch's fields changed, the rest kept.
pub fn apply(user: &User, patch: UserPatch) -> User {
    User {
        id: user.id.clone(),
        name: patch.name.unwrap_or_else(|| user.name.clone()),
        email: patch.email.unwrap_or_else(|| user.email.clone()),
        admin: patch.admin.unwrap_or(user.admin),
    }
}

/// What other users see of one, as JSON.
pub fn public_json(user: &User) -> String {
    let public = PublicUser { id: user.id.clone(), name: user.name.clone() };
    serde_json::to_string(&public).expect("a public user is JSON")
}

/// Reads a `NewUser`, or says why it can't.
pub fn parse_new_user(text: &str) -> Result<NewUser, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Reads a `UserPatch`, or says why it can't.
pub fn parse_patch(text: &str) -> Result<UserPatch, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}
