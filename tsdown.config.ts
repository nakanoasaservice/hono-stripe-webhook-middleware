import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	format: ["cjs", "esm"],
	unbundle: true,
	exports: true,
	dts: true,
	sourcemap: true,
	clean: true,
});
