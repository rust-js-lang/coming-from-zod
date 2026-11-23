//! Chapter 13: one check, in two places. This crate is the signup check.
//! The server builds it natively (`examples/server.rs`); the browser runs
//! the JavaScript rust-js writes of it. Same code, same answers.

use serde::{Deserialize, Serialize};

/// What the signup form sends.
#[derive(Deserialize)]
struct SignupForm {
    name: String,
    email: String,
    age: u32,
}

/// A signup whose fields make sense: made only through `try_from`.
#[derive(Debug, Serialize, Deserialize)]
#[serde(try_from = "SignupForm")]
pub struct Signup {
    pub name: String,
    pub email: String,
    pub age: u32,
}

impl TryFrom<SignupForm> for Signup {
    type Error = String;

    /// Every rule the form breaks, as `field: message`.
    fn try_from(form: SignupForm) -> Result<Self, Self::Error> {
        let mut problems = Vec::new();
        if form.name.trim().is_empty() {
            problems.push("name: required");
        }
        match form.email.split_once('@') {
            Some((user, domain)) if !user.is_empty() && domain.contains('.') => {}
            _ => problems.push("email: not an email address"),
        }
        if form.age < 13 {
            problems.push("age: must be 13 or older");
        }
        match problems.is_empty() {
            true => Ok(Signup { name: form.name.trim().to_string(), email: form.email, age: form.age }),
            false => Err(problems.join(" | ")),
        }
    }
}

/// Why a signup was refused, as the server answers it.
#[derive(Serialize)]
struct Refusal {
    error: String,
}

/// The server's answer to a signup's body: `201` and the signup made, or
/// `422` and why not. The browser asks it too, before it sends anything.
pub fn respond(body: &str) -> (u16, String) {
    match serde_json::from_str::<Signup>(body) {
        Ok(signup) => (201, serde_json::to_string(&signup).expect("a signup is JSON")),
        Err(error) => (422, serde_json::to_string(&Refusal { error: error.to_string() }).expect("a refusal is JSON")),
    }
}
