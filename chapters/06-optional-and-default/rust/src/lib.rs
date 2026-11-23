//! Chapter 6: optional, nullable and default. zod has three ways to say a
//! field may have nothing in it; Rust has one `Option`, and serde's
//! attributes say what the JSON may leave out.

use serde::Deserialize;

/// The theme a profile has when it says none.
fn light() -> String {
    "light".to_string()
}

/// A user's profile, as a settings page sends it.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    /// Always there.
    pub name: String,
    /// May be left out, or `null`: serde reads either as `None`.
    pub nickname: Option<String>,
    /// Must be there, but may be `null`: reading it with `Option`'s own
    /// `deserialize` takes away serde's "missing means `None`".
    #[serde(deserialize_with = "Option::deserialize")]
    pub bio: Option<String>,
    /// `"light"` when it's left out.
    #[serde(default = "light")]
    pub theme: String,
    /// `false` when it's left out: a `bool`'s `Default`.
    #[serde(default)]
    pub newsletter: bool,
}

/// Reads a `Profile` out of JSON text, or says why it can't.
pub fn parse_profile(text: &str) -> Result<Profile, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// The greeting a page shows: the nickname if there is one, else the name.
pub fn greeting(profile: &Profile) -> String {
    let name = profile.nickname.as_deref().unwrap_or(&profile.name);
    format!("Hi, {name}! ({} theme)", profile.theme)
}

/// Whether the profile has a nickname to show.
pub fn has_nickname(profile: &Profile) -> bool {
    profile.nickname.is_some()
}
