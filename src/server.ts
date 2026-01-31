import log from "./utils/logger.js";
import { version } from "../package.json";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

Bun.serve({
	port: PORT,
	development: process.env.NODE_ENV !== "production",
	routes: {
		"/": () => {
			return new Response(JSON.stringify({ status: "ok", message: "SatrxWiki API is running!", apiVersionsSupported: ["v1"], appVersion: version }), {
				headers: { "Content-Type": "application/json" },
				status: 200,
			});
		},

		"/v1/*": async (req) => {
			const url = new URL(req.url);
			const path = url.pathname.replace("/v1/", "");
			const filePath = `./routes/v1/${path}.ts`;
			try {
				const module = await import(filePath);
				return await module.default(req);
			} catch (error) {
				return new Response(JSON.stringify({ status: "nok", error: "API endpoint not found" }), { status: 404 });
			}
		},
	},
});
log.info(`Server is running on http://0.0.0.0:${PORT}`);
