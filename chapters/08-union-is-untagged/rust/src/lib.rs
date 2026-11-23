//! Chapter 8: `z.union` is `#[serde(untagged)]`. A value that may be one of
//! a few shapes, with no field to say which: each is tried in turn.

use serde::Deserialize;

/// An id: a number, or text.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(untagged)]
#[cfg_attr(rust_js, rust_js::untagged)]
pub enum Id {
    Number(u32),
    Text(String),
}

/// Reached by email.
#[derive(Debug, Deserialize)]
pub struct Email {
    #[cfg_attr(rust_js, rust_js::test(key))]
    pub email: String,
}

/// Reached by phone.
#[derive(Debug, Deserialize)]
pub struct Phone {
    #[cfg_attr(rust_js, rust_js::test(key))]
    pub phone: String,
    pub ext: Option<String>,
}

/// How to reach someone: an email, or a phone.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
#[cfg_attr(rust_js, rust_js::untagged)]
pub enum Contact {
    Email(Email),
    Phone(Phone),
}

/// A person, with an id and a way to reach them.
#[derive(Debug, Deserialize)]
pub struct Person {
    pub id: Id,
    pub contact: Contact,
}

/// Reads a `Person` out of JSON text, or says why it can't.
pub fn parse_person(text: &str) -> Result<Person, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// An id as a label shows it: `#42`, or the text itself.
pub fn id_label(id: &Id) -> String {
    match id {
        Id::Number(n) => format!("#{n}"),
        Id::Text(text) => text.clone(),
    }
}

/// How to reach someone, in words.
pub fn reach(contact: &Contact) -> String {
    match contact {
        Contact::Email(Email { email }) => format!("write to {email}"),
        Contact::Phone(Phone { phone, ext: Some(ext) }) => format!("call {phone}, ext. {ext}"),
        Contact::Phone(Phone { phone, ext: None }) => format!("call {phone}"),
    }
}
