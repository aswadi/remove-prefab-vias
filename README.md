# remove-prefab-vias

Remove unused holes and pre-existing traces belonging to a prefabricated clad from a composed
[Circuit JSON](https://github.com/tscircuit/circuit-json) design.

The bare clad Circuit JSON is used as the reference inventory. Hole and trace
ownership is inferred from PCB geometry, so source groups, component names, and
generated element IDs do not need to match between the two files.

## Web app

The repository includes a ChatGPT Site that performs the same cleanup entirely
in the browser. Run it locally with:

```sh
bun install
bun run dev
```

Choose the bare clad and composed Circuit JSON files, review the matched,
removed, and preserved counts, then download the cleaned file. Every trace
matched to the bare clad is removed; circuit-owned traces remain.

## CLI

```sh
bun install
bun run src/cli.ts \
  path/to/clad.circuit.json \
  path/to/final.circuit.json \
  path/to/final.no-unused-prefab-holes.circuit.json
```

The inputs must use the same PCB coordinate system. The command handles
`pcb_hole`, `pcb_plated_hole`, and `pcb_via` elements. It removes a matched clad
hole only when no non-clad trace uses it. It also removes every pre-existing
clad trace matched by route geometry. Used holes, circuit-owned traces, ports,
layers, and final-circuit-only holes remain unchanged.

## API

```ts
import {
  parseCircuitJson,
  removeUnusedPrefabHoles,
} from "remove-prefab-vias"

const clad = parseCircuitJson(await Bun.file("clad.circuit.json").text())
const finalCircuit = parseCircuitJson(
  await Bun.file("final.circuit.json").text(),
)

const result = removeUnusedPrefabHoles(clad, finalCircuit)
await Bun.write(
  "final.no-unused-prefab-holes.circuit.json",
  `${JSON.stringify(result.circuitJson, null, 2)}\n`,
)
```

By default, geometry is compared with a `1e-6` coordinate tolerance. Override
it when necessary:

```ts
removeUnusedPrefabHoles(clad, finalCircuit, {
  coordinateTolerance: 1e-5,
})
```

The function deliberately performs no other laser-specific postprocessing: it
does not enlarge drills, filter layers, or generate tooling paths.
