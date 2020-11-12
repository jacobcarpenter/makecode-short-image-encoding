# MakeCode Arcade Short Image Encoding

A more convenient format for sharing MakeCode Arcade serialized images (`` img`...` ``).

See a demo at https://makecode-short-image.vercel.app/.

You’ll find a single large `textarea` that accepts `` img`...` `` formatted data. The URL of the page dynamically updates in response to new image data being pasted into the `textarea`. A link to the page can be shared to conveniently share the same image.

## Encoding Format

### Base58

The short image format employs a [`Base58` encoding scheme](https://tools.ietf.org/id/draft-msporny-base58-02.html). This was chosen for [several reasons](https://tools.ietf.org/id/draft-msporny-base58-02.html#section-1-2):

-   Base58’s alphabet contains only URL-safe characters; including a short-encoded image in a URL will not incur any bloat from URL encoding.
-   Base58’s alphabet does not contain any word-breaking characters. A short-encoded image won’t linebreak when pasted into a messaging/email application.
-   Moreover, with no word-breaking characters, simply double-clicking will select a whole shortened image as a single word.

The last two benefits would be especially useful if MakeCode Arcade someday adds native support for pasting this (or a similar) format.

### Data layout

| byte # | bit offset | data                                                            |
| ------ | ---------- | --------------------------------------------------------------- |
| 1      | 4–7        | version identifier (always `0001`)                              |
| 1      | 0–3        | high 4 bits of a 12-bit image width                             |
| 2      | 0–7        | low 8 bits of a 12-bit image width                              |
| 3+     |            | pairs of consecutive pixel values are packed into a single byte |
|        | 0–3        | fist pixel of pair                                              |
|        | 4–7        | second pixel of pair                                            |

Image widths are represented as a 12-bit value. Widths may range from 1–4,095 (zero is invalid).

When the total image pixel count (`width ✖️ num rows`) is odd, the last packed pixel leaves the second value zeroed out, and it is trimmed during decoding.
