//! The server: `cargo run --example server`. A plain HTTP server of std's,
//! one request at a time, whose every answer is the crate's `respond`.

use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpListener;

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:0")?;
    println!("listening on {}", listener.local_addr()?);
    for stream in listener.incoming() {
        let mut stream = stream?;
        let mut reader = BufReader::new(stream.try_clone()?);
        // The request's headers, for its body's length.
        let mut length = 0;
        loop {
            let mut line = String::new();
            reader.read_line(&mut line)?;
            let line = line.trim_end().to_ascii_lowercase();
            if line.is_empty() {
                break;
            }
            if let Some(value) = line.strip_prefix("content-length:") {
                length = value.trim().parse().unwrap_or(0);
            }
        }
        let mut body = vec![0; length];
        reader.read_exact(&mut body)?;
        let (status, json) = chapter_13_one_check_two_places::respond(&String::from_utf8_lossy(&body));
        let reason = if status == 201 { "Created" } else { "Unprocessable Content" };
        write!(
            stream,
            "HTTP/1.1 {status} {reason}\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{json}",
            json.len()
        )?;
    }
    Ok(())
}
