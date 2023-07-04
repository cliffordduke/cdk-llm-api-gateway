import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {ContainerImages} from "./container-images";
import {writeFileSync} from 'fs';
import * as path from "path";

interface ModelManifest {
    readonly model_id: string;
    readonly version: string;
    readonly min_version: string;
    readonly spec_key: string;
}

export interface ModelInformation {
    readonly model_id: string;
    readonly model_image: string;
    readonly model_bucket: string;
    readonly model_data_uri: string;
    readonly env_variables: { [key: string]: string | number };
    readonly region: string;
}

export type ModelList = {
    [modelId: string]: ModelInformation
}

export type Manifest = {
    [region: string]: ModelList
}

export enum Models {
    Falcon40b ='huggingface-llm-falcon-40b-bf16',
    Falcon40bInstruct = 'huggingface-llm-falcon-40b-instruct-bf16',
    Falcon7b = 'huggingface-llm-falcon-7b-bf16',
    Falcon7bInstruct = 'huggingface-llm-falcon-7b-instruct-bf16'
};

async function GetManifest(region: AWSRegion): Promise<ModelList> {
    const bucket = `jumpstart-cache-prod-${region}`;
    const client = new S3Client({region});
    const manifestResponse = await client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: 'models_manifest.json'
    }));

    const manifestResponseString = await manifestResponse.Body?.transformToString();
    if (manifestResponseString == undefined) return Promise.reject("cannot get manifest")
    const manifest: [ModelManifest] = JSON.parse(manifestResponseString);
    const modelInformationList = await Promise.all((Object.values(Models)).map(async (modelId) => {
        const model = manifest.find(e => e.model_id === modelId)
        if (model === undefined) return Promise.reject("cannot find model")

        const specResponse = await client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: model.spec_key
        }));
        const specResponseString = await specResponse.Body?.transformToString();
        if (specResponseString == undefined) return Promise.reject("cannot get spec");
        const spec = JSON.parse(specResponseString);
        const env: [InferenceEnvVariable] = spec.inference_environment_variables;

        const result: ModelInformation = {
            region,
            model_id: modelId,
            model_image: ContainerImages.GetImageUri(region),
            model_bucket: bucket,
            model_data_uri: spec.hosting_prepacked_artifact_key,
            env_variables: env.reduce((obj, item) => Object.assign(obj, {[item.name]: item.default}), {})
        };
        return result;
    }))
    return modelInformationList.reduce<ModelList>((obj, item) => Object.assign(obj, {[item.model_id]: item}), {})
}

export async function CreateManifest(): Promise<Manifest> {
    let manifest: Manifest = {}
    for (const [value, index] of Object.entries(AWSRegion)) {
        manifest[index] = await GetManifest(index);
    }
    return manifest;
}

interface InferenceEnvVariable {
    name: string,
    type: string,
    default: string,
    scope: string,
    required_for_model_class: string
}

enum AWSRegion {
    AFSouth1 = "af-south-1",
    APSouth1 = "ap-south-1",
    EUNorth1 = "eu-north-1",
    EUWest3 = "eu-west-3",
    EUWest2 = "eu-west-2",
    EUWest1 = "eu-west-1",
    APNortheast3 = "ap-northeast-3",
    APNortheast2 = "ap-northeast-2",
    APNortheast1 = "ap-northeast-1",
    CACentral1 = "ca-central-1",
    SAEast1 = "sa-east-1",
    APEast1 = "ap-east-1",
    APSoutheast1 = "ap-southeast-1",
    APSoutheast2 = "ap-southeast-2",
    EUCentral1 = "eu-central-1",
    USEast1 = "us-east-1",
    USEast2 = "us-east-2",
    USWest1 = "us-west-1",
    USWest2 = "us-west-2"
}