import fs from "fs";
import path from "path";
import {sexpParse, sexpCallName} from "./sexp.js";
import {arrayify} from "./js-util.js";

class Footprint {
	constructor(sexp) {
		this.sexp=sexp;
	}

	getCentroid() {
		let min=[0,0];
		let max=[0,0];

		for (let exp of this.sexp) {
			if (sexpCallName(exp)=="pad") {
				for (let sub of exp) {
					if (sexpCallName(sub)=="at") {
						let at=[sub[1],sub[2]]
						min=[Math.min(min[0],at[0]),Math.min(min[1],at[1])];
						max=[Math.max(max[0],at[0]),Math.max(max[1],at[1])];
					}
				}
			}
		}

		return [(min[0]+max[0])/2,(min[1]+max[1])/2];
	}
}

function loadLibTable(libTableFn) {
	let res={};
	let exp=sexpParse(fs.readFileSync(libTableFn,"utf8"))[0];
	if (sexpCallName(exp)!="fp_lib_table")
		throw new Error("Unable to parse lib table");

	for (let expChild of exp) {
		if (sexpCallName(expChild)=="lib") {
			let libName,libUri;

			for (let libChild of expChild) {
				switch (sexpCallName(libChild)) {
					case "name":
						libName=libChild[1];
						break;

					case "uri":
						libUri=libChild[1];
						break;
				}
			}

			let resolved=path.resolve(libUri.replace("${KIPRJMOD}",path.dirname(libTableFn)));
			res[libName]=resolved;
		}
	}

	return res;
}

export default class FootprintLibrary {
	constructor({footprintDirs, projectDir}) {
		this.paths=[];
		this.footprints={};
		this.paths.push(...arrayify(footprintDirs));
		this.paths.push(".");

		this.tableLibs={};

		let libTableFn=path.join(projectDir,"fp-lib-table");
		if (fs.existsSync(libTableFn))
			this.tableLibs=loadLibTable(libTableFn);

		//console.log(this.tableLibs);
	}

	getFootprint(footprintName) {
		if (this.footprints[footprintName])
			return this.footprints[footprintName];

		//console.log("getting: "+footprintName);

		let [library,name]=footprintName.split(":");
		//console.log("load footprint: "+library+" : "+name);

		let libraryPath;
		for (let p of this.paths) {
			let cand=path.join(p,library)+".pretty";
			if (fs.existsSync(cand))
				libraryPath=cand;
		}

		if (this.tableLibs[library])
			libraryPath=this.tableLibs[library];

		if (!libraryPath)
			throw new Error("Library not found: "+library);

		let fn=path.join(libraryPath,name)+".kicad_mod";
		let footprint=new Footprint(sexpParse(fs.readFileSync(fn,"utf8"))[0]);
		this.footprints[footprintName]=footprint;

		return this.footprints[footprintName];
	}
}