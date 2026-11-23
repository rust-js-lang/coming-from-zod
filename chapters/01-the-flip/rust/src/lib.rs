//! Chapter 1: the flip. You write the type; serde writes the check.

use serde::Deserialize;

/// A user, as JSON sends one.
#[derive(Debug, Deserialize)]
pub struct User {
    pub name: String,
    pub age: u32,
}

/// Reads a `User` out of JSON text, or says why it can't.
pub fn parse_user(text: &str) -> Result<User, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}
