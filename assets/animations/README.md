# Care animations

Put animation files in this folder and the website plays them when the matching
care button is pressed. Until a file is here, the built-in effects play instead.

| File name | When it plays |
| --- | --- |
| `feed` | Feeding any snack |
| `feed-kelp`, `feed-clam`, `feed-fish`, `feed-cake` | A specific snack (optional, overrides `feed`) |
| `cuddle` | Cuddle button, or tapping the otter |
| `bath` | Bath button |
| `nap` | Falling asleep (Nap button) |
| `sleeping` | Loops for as long as the otter is asleep |
| `wake` | Waking up |
| `gift` | Opening the daily gift |
| `trick-rollover`, `trick-juggle`, `trick-handstand`, `trick-twirl` | Performing a trick (Grown Otters learn these) |
| `levelup` | Reaching a new level |
| `grow` | Growing into the next stage (Young, Grown, Wise) |
| `birthday` | The birthday party starting |
| `mission-return` | Coming home from a mission |
| `discover` | Finding something new while exploring |
| `hug` | Hugging a friend's otter |
| `outfit` | Putting on clothes |
| `donate` | Donating to the Pond Museum |

On tabs where the pond isn't showing (Den, Explore, Friends), the animation plays
in a little pop-up in the middle of the screen instead.

Add the extension that matches your file, e.g. `bath.webp`.

**Formats:** animated `.webp` (best), `.gif`, animated `.png` (APNG), or `.webm`
video with a transparent background. Use a transparent background so the pond
shows through.

**Size:** square-ish, about **420 × 520 px** (the otter's spot on the pond is 214 × 262,
so 2× keeps it sharp on phones). Keep the otter roughly centered with its feet near
the bottom, like the drawn otter, so it lines up.

**Length:** about 2–3 seconds. By default the animation *replaces* the drawn otter
while it plays, then the drawn otter comes back.

## Optional settings: `animations.json`

To change how long something plays, or to draw *on top of* the otter instead of
replacing it (e.g. a sparkle effect), add an `animations.json` file here:

```json
{
  "bath": { "file": "bath.webp", "duration": 3200 },
  "gift": { "file": "sparkles.gif", "duration": 1800, "mode": "overlay" }
}
```

`duration` is in milliseconds. `mode` is `"replace"` (default) or `"overlay"`.
`.webm` videos stop when the video ends.
