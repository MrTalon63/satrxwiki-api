export type Satellite = {
	name: string;
	state: "active" | "inactive" | "unknown" | "partial";
	downlinks: Downlink[];
	notes: string;
};

type Downlink = {
	frequencies: number[];
	type: string;
	bandwidth: string;
	polarization: string;
	dumpLocations: string[];
};
