import {ContextProviderPlugin, Plugin, PluginHost} from "aws-cdk/lib/api/plugin";
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';

export class ModelManifestPlugin implements Plugin {
    version: "1";

    init(host: PluginHost): void {
        const source = new ModelManifestContextPlugin();
        host.registerContextProviderAlpha("helper", source);
    }
}

interface ModelManifestQuery {
    readonly region: string,
    readonly modelId: string
}

export interface ModelManifestContext {
   // readonly model_image: string;
    readonly model_bucket: string;
    readonly model_data_uri: string;
   // readonly env_variables: Map<string, string>;
}

interface ModelManifest {
    readonly model_id: string;
    readonly version: string;
    readonly min_version: string;
    readonly spec_key: string;
}

class ModelManifestContextPlugin implements ContextProviderPlugin {
    public async getValue(args: ModelManifestQuery ): Promise<ModelManifestContext> {
        const bucket = `s3://jumpstart-cache-prod-${args.region}/`;
        const client = new S3Client(args.region);
        const manifestResponse = await client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: 'models_manifest.json'
        }));

        const manifestResponseString = await manifestResponse.Body?.transformToString();
        if (manifestResponseString == undefined) return Promise.reject("cannot get manifest")
        const manifest: [ModelManifest] = JSON.parse(manifestResponseString);
        const model = manifest.find(e => e.model_id === args.modelId)
        if (model === undefined) return Promise.reject("cannot find model")

        const specResponse = await client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: model.spec_key
        }));
        const specResponseString = await specResponse.Body?.transformToString();
        if (specResponseString == undefined) return Promise.reject("cannot get spec");
        const spec = JSON.parse(specResponseString);

        const result : ModelManifestContext = {
            model_bucket: bucket,
            model_data_uri: spec.hosting_prepacked_artifact_key
        }


        return Promise.resolve(result);
    }

}