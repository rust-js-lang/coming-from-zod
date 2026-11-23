//! Chapter 11: `z.record` is a `HashMap`, and a set of tags a `HashSet`.
//! Keys known only when the data arrives, and values all of one type.

use serde::Deserialize;
use std::collections::{HashMap, HashSet};

/// A shop's stock: how many of each item, and the shop's tags.
#[derive(Debug, Deserialize)]
pub struct Stock {
    pub counts: HashMap<String, u32>,
    pub tags: HashSet<String>,
}

/// Reads a `Stock` out of JSON text, or says why it can't.
pub fn parse_stock(text: &str) -> Result<Stock, String> {
    serde_json::from_str(text).map_err(|error| error.to_string())
}

/// How many items in all.
pub fn total(stock: &Stock) -> u32 {
    stock.counts.values().sum()
}

/// The items there are fewer than `below` of, by name.
pub fn low(stock: &Stock, below: u32) -> Vec<String> {
    let mut items: Vec<String> = (stock.counts.iter())
        .filter(|(_, count)| **count < below)
        .map(|(item, _)| item.clone())
        .collect();
    items.sort();
    items
}

/// How many there are of `item`: none if the shop doesn't stock it.
pub fn count(stock: &Stock, item: &str) -> u32 {
    stock.counts.get(item).copied().unwrap_or(0)
}

/// Whether the shop has the tag.
pub fn tagged(stock: &Stock, tag: &str) -> bool {
    stock.tags.contains(tag)
}
