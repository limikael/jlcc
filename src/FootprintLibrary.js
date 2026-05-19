import fs from "fs";
import path from "path";
import {sexpParse, sexpCallName} from "./sexp.js";
import {arrayify} from "./js-util.js";

class Footprint {
	constructor(sexp) {
		this.sexp=sexp;
	}

	getCentroid() {
		let sum=[0,0];
		let count=0;

		for (let x of this.sexp) {
			if (sexpCallName(x)=="pad") {
				for (let y of x) {
					if (sexpCallName(y)=="at") {
						sum[0]+=y[1];
						sum[1]+=y[2];
						count++;
					}
				}
			}
		}

		if (!count)
			return sum;

		return sum.map(v=>v/count);
	}
}

export default class FootprintLibrary {
	constructor(p) {
		this.paths=[];
		this.footprints={};

		this.paths.push(...arrayify(p));

		this.paths.push(".");
	}

	getFootprint(footprintName) {
		if (this.footprints[footprintName])
			return this.footprints[footprintName];

		let [library,name]=footprintName.split(":");
		//console.log("load footprint: "+library+" : "+name);

		let libraryPath;
		for (let p of this.paths) {
			let cand=path.join(p,library)+".pretty";
			if (fs.existsSync(cand))
				libraryPath=cand;
		}

		if (!libraryPath)
			throw new Error("Library not found: "+library);

		let fn=path.join(libraryPath,name)+".kicad_mod";
		let footprint=new Footprint(sexpParse(fs.readFileSync(fn,"utf8"))[0]);
		this.footprints[footprintName]=footprint;

		return this.footprints[footprintName];
	}
}