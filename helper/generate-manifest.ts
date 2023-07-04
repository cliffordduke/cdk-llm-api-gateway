import {writeFileSync} from "fs";
import path from "path";
import {CreateManifest} from "./manifest";

CreateManifest().then((manifest) => writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2)))
