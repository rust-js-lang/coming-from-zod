//! Chapter 15: a schema that holds itself. A comment has replies, which are
//! comments. In Rust, a type may name itself, so there's nothing to do.

use serde::Deserialize;

/// A comment, and its replies, each a comment.
#[derive(Debug, Deserialize)]
pub struct Comment {
    pub author: String,
    pub text: String,
    #[serde(default)]
    pub replies: Vec<Comment>,
}

/// Reads a thread out of JSON text, or says why it can't.
pub fn parse_thread(text: &str) -> Result<Comment, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// How many comments in the thread, this one too.
pub fn count(comment: &Comment) -> usize {
    1 + comment.replies.iter().map(count).sum::<usize>()
}

/// How deep the thread goes: 1 for a comment with no replies.
pub fn depth(comment: &Comment) -> usize {
    1 + comment.replies.iter().map(depth).max().unwrap_or(0)
}

/// Who wrote in the thread, each once, sorted.
pub fn authors(comment: &Comment) -> Vec<String> {
    let mut all = vec![comment.author.clone()];
    for reply in &comment.replies {
        all.extend(authors(reply));
    }
    all.sort();
    all.dedup();
    all
}
