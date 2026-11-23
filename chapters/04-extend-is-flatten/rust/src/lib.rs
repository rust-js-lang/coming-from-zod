//! Chapter 4: `.extend` is a field. A `User` has a `Base`, and flatten
//! spreads its fields into the user's, in the JSON and in the JavaScript.

use serde::Deserialize;

/// What every record has.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Base {
    pub id: String,
    pub created_at: String,
}

/// A user: a record, and a name and an email.
#[derive(Debug, Deserialize)]
pub struct User {
    #[serde(flatten)]
    #[cfg_attr(rust_js, rust_js::flatten)]
    pub base: Base,
    pub name: String,
    pub email: String,
}

/// A post: a record, and a title and who wrote it.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Post {
    #[serde(flatten)]
    #[cfg_attr(rust_js, rust_js::flatten)]
    pub base: Base,
    pub title: String,
    pub author_id: String,
}

/// Reads a `User` out of JSON text, or says why it can't.
pub fn parse_user(text: &str) -> Result<User, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Reads a `Post` out of JSON text, or says why it can't.
pub fn parse_post(text: &str) -> Result<Post, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Takes any record's `Base`: a user's, `&user.base`, or a post's.
pub fn label(record: &Base) -> String {
    format!("{}, created {}", record.id, record.created_at)
}

/// A post's byline, which reads the post's own fields and its base's.
pub fn byline(post: &Post, author: &User) -> String {
    format!("{} by {} ({})", post.title, author.name, label(&post.base))
}
