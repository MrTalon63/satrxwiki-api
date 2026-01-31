import * as cheerio from "cheerio";

import logger from "../../../utils/logger";
import type { Satellite } from "../../../type";

let leoSatellites: Satellite[] = [];
let lastFetchTime = 0;

async function fetchLEOSatellites() {
	logger.info("Fetching LEO satellites from SatrxWiki...");
	leoSatellites = [];
	const response = await fetch(`${process.env.SATRX_URL || "https://satrx.wiki/"}en/satellites`);
	const html = await response.text();
	const parser = cheerio.load(html);

	const satelliteElements = parser("figure.table")
		.text()
		.trim()
		.split("\n")
		.map((element) => element.trim());
	satelliteElements.shift();
	const lastLeoEl = satelliteElements.indexOf("Identifier") - 1;
	const leo = satelliteElements.slice(0, lastLeoEl);
	if (satelliteElements.length === 0 || lastLeoEl === -1) return;

	for (let i = 0; i < leo.length; i++) {
		if (leo[i] && (leo[i + 1] === "🔴" || leo[i + 1] === "🟢")) {
			logger.verbose(`Found satellite: ${leo[i]}`);

			const name = leo[i] || "";
			let state: "active" | "inactive" | "unknown" | "partial" = "unknown";
			if (leo[i + 1] === "🟢") state = "active";
			else if (leo[i + 1] === "🔴") state = "inactive";
			const frequencies: number[] = leo[i + 2]?.split(", ").map((freq) => parseFloat(freq)) || [];
			leoSatellites.push({
				name,
				state,
				downlinks: [
					{
						frequencies,
						type: leo[i + 3] || "",
						bandwidth: leo[i + 4] || "",
						polarization: leo[i + 5] || "",
						dumpLocations: leo[i + 6]?.split(";") || [],
					},
				],
				notes: leo[i + 7] || "",
			});
		}

		if (leo[i] === "" && (leo[i + 1] === "🔴" || leo[i + 1] === "🟢")) {
			const lastSat = leoSatellites[leoSatellites.length - 1] as Satellite;
			logger.verbose(`Found another downlink for: ${lastSat.name}`);

			const frequencies: number[] = leo[i + 2]?.split(", ").map((freq) => parseFloat(freq)) || [];
			lastSat.downlinks.push({
				frequencies,
				type: leo[i + 3] || "",
				bandwidth: leo[i + 4] || "",
				polarization: leo[i + 5] || "",
				dumpLocations: leo[i + 6]?.split(";") || [],
			});
		}
	}

	leoSatellites = leoSatellites.filter((sat) => sat.name !== "");
	lastFetchTime = Date.now();
}

export default async function getLEOSatellites() {
	if (leoSatellites.length === 0 || lastFetchTime + parseInt(process.env.FETCH_TIME || "86400") * 1000 < Date.now()) await fetchLEOSatellites();
	return await new Response(JSON.stringify({ status: "ok", data: leoSatellites }), {
		headers: { "Content-Type": "application/json" },
		status: 200,
	});
}
