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

	function createDownlink(index: number) {
		return {
			frequencies: leo[index + 2]?.split(", ").map((freq) => parseFloat(freq)) || [],
			type: leo[index + 3] || "",
			bandwidth: leo[index + 4] || "",
			polarization: leo[index + 5] || "",
			dumpLocations: leo[index + 6]?.split(";") || [],
		};
	}

	for (let elementIndex = 0; elementIndex < leo.length; elementIndex++) {
		const stateIndicator = leo[elementIndex + 1];
		if (stateIndicator !== "🔴" && stateIndicator !== "🟢") continue;

		const name = leo[elementIndex];

		if (name) {
			// New satellite
			logger.verbose(`Found satellite: ${name}`);
			leoSatellites.push({
				name,
				state: stateIndicator === "🟢" ? "active" : "inactive",
				downlinks: [createDownlink(elementIndex)],
				notes: leo[elementIndex + 7] || "",
			});
		} else if (leoSatellites.length > 0) {
			// Additional downlink for previous satellite
			const lastSat = leoSatellites[leoSatellites.length - 1] as Satellite;
			logger.verbose(`Found another downlink for: ${lastSat.name}`);
			lastSat.downlinks.push(createDownlink(elementIndex));
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
