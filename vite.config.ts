import { defineConfig } from "vite-plus";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
export default defineConfig({
	plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],

	fmt: {
		useTabs: true,
		ignorePatterns: [
			"dist/**",
			".wrangler/**",
			"worker-configuration.d.ts",
			"jsr.jsonc",
			"pnpm-lock.yaml",
		],
	},
	lint: {
		options: { typeAware: true, typeCheck: true },
		ignorePatterns: ["dist/**", ".wrangler/**", "worker-configuration.d.ts"],
	},
	pack: {
		deps: {
			// tsdown <0.23 compatibility: resolve external dependency subpaths.
			// Remove to preserve subpath imports as written (the new default).
			// https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
			resolveDepSubpath: true,
		},
		entry: "src/index.ts",
		format: ["cjs", "esm"],
		unbundle: true,
		exports: true,
		dts: true,
		sourcemap: true,
		clean: true,
	},
});
