#!/usr/bin/env bun

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseCircuitJson, removeUnusedPrefabHoles } from "./index";

const run = async (): Promise<void> => {
	const [cladArgument, finalArgument, outputArgument, ...extraArguments] =
		process.argv.slice(2);
	if (
		!cladArgument ||
		!finalArgument ||
		!outputArgument ||
		extraArguments.length > 0
	) {
		throw new Error(
			"Usage: remove-prefab-vias <clad.circuit.json> <final.circuit.json> <output.circuit.json>",
		);
	}

	const cladPath = resolve(cladArgument);
	const finalPath = resolve(finalArgument);
	const outputPath = resolve(outputArgument);
	if (outputPath === cladPath || outputPath === finalPath) {
		throw new Error("The output path must differ from both input paths");
	}

	const [cladContents, finalContents] = await Promise.all([
		readFile(cladPath, "utf8"),
		readFile(finalPath, "utf8"),
	]);
	const result = removeUnusedPrefabHoles(
		parseCircuitJson(cladContents),
		parseCircuitJson(finalContents),
	);

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		`${JSON.stringify(result.circuitJson, null, 2)}\n`,
	);

	console.log(
		`Matched ${result.matchedCladHoleCount} clad holes, removed ${result.removedUnusedCladHoleCount} unused holes and ${result.removedCladTraceCount} pre-existing clad traces, preserved ${result.preservedUsedCladHoleCount} used holes, and wrote ${outputPath}`,
	);
};

try {
	await run();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
