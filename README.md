# AE Export Layers

Three small ExtendScript utilities for Adobe After Effects that automate a
tedious compositing chore: rendering each layer of a comp as its own pass, and
keeping a text record of what was exported and how each layer was set.

Typical use: a stop-motion or 2D compositing shot where every layer must be
delivered (or archived) as a separate render, together with a note of each
layer's blend mode and opacity so the comp can be rebuilt elsewhere.

Free, MIT-licensed, maintained by the [Stop Motion Database](https://stop-motion-database.pages.dev/).

## The scripts

| Script | What it does |
|---|---|
| `export-visible-layers.jsx` | Renders each visible (non-guide) layer of the active comp as its own pass. Solos one layer at a time, sends the comp through the render queue, and writes each pass into its own `<comp>_batchNN` subfolder next to the project file. |
| `export-layer-info.jsx` | Walks every comp in the project and writes a `<comp>_layerinfo_<date>.txt` per comp listing each layer's name, blend mode, opacity, and comment. If any layer is soloed, only soloed layers are listed; otherwise all enabled layers. |
| `export-layers-with-info.jsx` | Both of the above in one run, for the active comp: renders each visible layer into a dated parent folder and writes a layer-info text file that maps each batch number to its layer and settings. |

## Requirements

- Adobe After Effects (any recent version; the scripts use only core
  ExtendScript APIs).
- For the two rendering scripts: an **output module template named
  `batch_export`** must exist. Create one in AE (Edit → Templates → Output
  Module) with your preferred format — e.g. EXR or PNG sequence — and name it
  exactly `batch_export`. The scripts read the file extension from this
  template.
- Save your project first; passes are written next to the project file.

## Install / run

No installation needed. In After Effects:

1. `File → Scripts → Run Script File…`
2. Pick the script.

To allow the scripts to write files, enable
`Preferences → Scripting & Expressions → Allow Scripts to Write Files and Access Network`.

## Output example

Running `export-layers-with-info.jsx` on a comp named `Shot_010` on June 3rd:

```
Shot_010_0603/
├── Shot_010_batch01/
│   └── Shot_010_batch01_0001.exr …
├── Shot_010_batch02/
│   └── Shot_010_batch02_0001.exr …
└── Shot_010_layerinfo_0603.txt
```

The info file:

```
Composition: Shot_010

Batch 01 - layer 02
FG_puppet
  Blend Mode: Normal
  Opacity: 100
  Comment:

Batch 02 - layer 05
BG_plate
  Blend Mode: Multiply
  Opacity: 80
  Comment: re-render if grade changes
```

## Notes

- Layer solo states are restored (cleared) after export; the render queue item
  is removed after each pass, so your queue is left as it was.
- The "Overwrite Output" preference is temporarily forced on during batch
  rendering and restored afterwards.
- Guide layers and disabled layers are skipped.

## License

MIT — see [LICENSE](LICENSE).
