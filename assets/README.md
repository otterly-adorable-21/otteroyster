# Brand art

| File | What it is | Where it shows up |
| --- | --- | --- |
| `logo.png` | "Otter & Oyster" wordmark banner | Top of every page, adoption screen, link previews |
| `emblem.png` | Round emblem (otter hugging the oyster) | Browser tab icon, phone home-screen icon, header badge. Also upload it as the Discord bot's avatar |
| `lily-border.png` | Three water lilies border | Section dividers |
| `pond.png` | Willow pond painting | Faded page background |
| `otter-float.png` | Otter floating among lilies | Discord tab hero image |

These are the full-size originals. The site loads the small, fast copies in
`web/`, which are made from these (about 1 MB total instead of 11 MB).

## Replacing art

Upload the new file with the same name. **Upload it with the final name instead
of renaming it on GitHub afterwards.** Renaming images in GitHub's web editor
emptied two of them once. Until the `web/` copy is regenerated, the site keeps
showing the old optimized version, so ask Claude to "re-optimize the art" (or
delete the matching file in `web/` and the site falls back to your original).
