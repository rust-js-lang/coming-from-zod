//! Chapter 9: `.transform` and `z.coerce` are readers. The struct is what you
//! get out; what the JSON may look like on the way in is the code that reads
//! each field.

use serde::{Deserialize, Deserializer};

/// An email, as it's kept: trimmed and lower-case. The only way to make one
/// is `try_from`, so every `Email` is one.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(try_from = "String")]
pub struct Email(String);

impl TryFrom<String> for Email {
    type Error = String;

    fn try_from(text: String) -> Result<Self, Self::Error> {
        let email = text.trim().to_lowercase();
        match email.split_once('@') {
            Some((name, domain)) if !name.is_empty() && !domain.is_empty() => Ok(Email(email)),
            _ => Err(format!("not an email: {text:?}")),
        }
    }
}

impl Email {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// An age as the form sends it, a number or the text of one.
#[derive(Deserialize)]
#[serde(untagged)]
enum NumberOrText {
    Number(u32),
    Text(String),
}

/// `z.coerce.number().int().min(13)`: a number, or text that is one, 13 or
/// more.
fn age<'de, D: Deserializer<'de>>(d: D) -> Result<u32, D::Error> {
    let age = match NumberOrText::deserialize(d)? {
        NumberOrText::Number(n) => n,
        NumberOrText::Text(text) => text
            .trim()
            .parse()
            .map_err(|_| serde::de::Error::custom(format!("not a whole number: {text:?}")))?,
    };
    match age {
        13.. => Ok(age),
        _ => Err(serde::de::Error::custom(format!("too young: {age}"))),
    }
}

/// `"rust, zod,,js"`: each tag, trimmed, the empty ones left out.
fn tags<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
    let text = String::deserialize(d)?;
    Ok(text
        .split(',')
        .map(str::trim)
        .filter(|tag| !tag.is_empty())
        .map(str::to_string)
        .collect())
}

/// A signup, as it's kept, whatever the form sent.
#[derive(Debug, Deserialize)]
pub struct Signup {
    pub email: Email,
    #[serde(deserialize_with = "age")]
    pub age: u32,
    #[serde(deserialize_with = "tags")]
    pub tags: Vec<String>,
}

/// Reads a `Signup` out of the form's JSON, or says why it can't.
pub fn parse_signup(text: &str) -> Result<Signup, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// What the welcome email says.
pub fn welcome(signup: &Signup) -> String {
    format!("{} ({}), tagged {}", signup.email.as_str(), signup.age, signup.tags.join(" + "))
}
