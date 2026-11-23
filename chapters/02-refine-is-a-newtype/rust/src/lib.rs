//! Chapter 2: a refinement is a type. An `Email` can only be made by
//! checking one, so every `Email` in the program has been checked.

use serde::Deserialize;

/// An email address: text with one `@`, something on each side of it, and
/// no spaces.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(try_from = "String")]
pub struct Email(String);

impl TryFrom<String> for Email {
    type Error = String;

    fn try_from(text: String) -> Result<Email, String> {
        let Some((user, domain)) = text.split_once('@') else {
            return Err("an email has an @".to_string());
        };
        if user.is_empty() || domain.is_empty() || domain.contains('@') {
            Err("an email has one @, with text on each side".to_string())
        } else if text.contains(' ') {
            Err("an email has no spaces".to_string())
        } else {
            Ok(Email(text))
        }
    }
}

impl Email {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// A name that isn't blank.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(try_from = "String")]
pub struct Name(String);

impl TryFrom<String> for Name {
    type Error = String;

    fn try_from(text: String) -> Result<Name, String> {
        if text.trim().is_empty() {
            Err("a name isn't blank".to_string())
        } else {
            Ok(Name(text))
        }
    }
}

impl Name {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// A sign-up form, as JSON sends one.
#[derive(Debug, Deserialize)]
pub struct Signup {
    pub name: Name,
    pub email: Email,
}

/// Reads a `Signup` out of JSON text, or says why it can't.
pub fn parse_signup(text: &str) -> Result<Signup, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// Checks text as an `Email`, for code that has text, not JSON.
pub fn email(text: &str) -> Result<Email, String> {
    Email::try_from(text.to_string())
}

/// The welcome a new user is sent. It takes an `Email`, not any text, so it
/// can't be given one nobody checked.
pub fn welcome(name: &Name, email: &Email) -> String {
    format!("Welcome, {}! We'll write to {}.", name.as_str(), email.as_str())
}
