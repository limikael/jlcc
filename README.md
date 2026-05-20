# kicad-fab-export

A scriptable CLI tool for generating **JLCPCB manufacturing files** directly from a KiCad PCB file.

It is designed for automated workflows and deterministic, CI-friendly PCB exports.

## Overview

`kicad-fab-export` takes a KiCad PCB file (`.kicad_pcb`) as the single source of truth and generates JLCPCB-compatible manufacturing outputs:

* `bom.csv` — Bill of Materials
* `cpl.csv` — Pick and Place (Centroid file)
* `gerbers.zip` — Gerber fabrication archive

It does not require schematic files or project files.

## Key Design Principles

* PCB file is the source of truth
* No dependency on `.kicad_sch` or `.kicad_pro`
* Fully scriptable and deterministic
* Strict validation (fail fast on inconsistencies)
* Designed for automation pipelines

## Component Model

Each footprint placed on the PCB is treated as a potential component.

A footprint is included in outputs only if it has the attribute:

* `lcsc` → LCSC part number (required)

Optional attributes:

* `lcscRot` → Additional rotation offset applied in CPL generation

Footprints without `lcsc` are ignored.

## Footprint Resolution

`kicad-fab-export` resolves footprint geometry by loading `.kicad_mod` files from provided footprint directories.

It doesn't try to resolve these automatically because they are a bit inconsistent from system to system. You probably want to do something like:

```bash
kicad-fab-export board.kicad_pcb \
  -F /usr/share/kicad/footprints/ \
  -o ./out
```

It does however check the project for a `fp-lib-table` file and reads project specific library paths from there.

### Arguments

```
pcb   KiCad PCB file (.kicad_pcb)
```

## Options

```
-o, --output <dir>          Output directory
-F, --footprint-dir <path>  Footprint directory (can be used multiple times)
-h, --help                  Show help
```

## Output

All outputs are written to the specified output directory:

```
bom.csv
cpl.csv
gerbers.zip
```

### bom.csv

* One row per PCB footprint instance
* No grouping or aggregation
* Only footprints with `lcsc` attribute are included

### cpl.csv

* Pick and place file
* Includes centroid positions derived from footprint geometry
* Applies rotation correction using `lcscRot` if present

### gerbers.zip

* Standard Gerber export archive suitable for JLCPCB manufacturing

## Error Handling

`kicad-fab-export` uses strict validation and will **fail immediately** on any inconsistency.

Errors include:

* Missing footprint `.kicad_mod` files
* Missing or invalid footprint geometry
* Invalid footprint library resolution
* Malformed PCB data
* Duplicate or inconsistent component data

No partial output is produced on failure.

## Example

```bash
kicad-fab-export myboard.kicad_pcb -F ./libs -o ./out
```

Output:

```
out/
  bom.csv
  cpl.csv
  gerbers.zip
```

## Philosophy

`kicad-fab-export` is intentionally minimal and deterministic:

* No schematic parsing
* No netlist dependency
* No global KiCad environment dependency
* No grouping or BOM optimization (by design)
