export class ContainerImages {
    static readonly HF_PYTORCH_LLM_TGI_INFERENCE_0_8_2 = 'huggingface-pytorch-tgi-inference:2.0.0-tgi0.8.2-gpu-py39-cu118-ubuntu20.04';
    static readonly HF_PYTORCH_LLM_TGI_INFERENCE_0_6_0 = 'huggingface-pytorch-tgi-inference:2.0.0-tgi0.6.0-gpu-py39-cu118-ubuntu20.04';
    static readonly HF_PYTORCH_LLM_TGI_INFERENCE_LATEST = ContainerImages.HF_PYTORCH_LLM_TGI_INFERENCE_0_8_2;

    static readonly HF_LLM_ACCOUNT: { [key: string]: string } = {
        "af-south-1": "626614931356",
        "il-central-1": "780543022126",
        "ap-east-1": "871362719292",
        "ap-northeast-1": "763104351884",
        "ap-northeast-2": "763104351884",
        "ap-northeast-3": "364406365360",
        "ap-south-1": "763104351884",
        "ap-south-2": "772153158452",
        "ap-southeast-1": "763104351884",
        "ap-southeast-2": "763104351884",
        "ap-southeast-3": "907027046896",
        "ap-southeast-4": "457447274322",
        "ca-central-1": "763104351884",
        "cn-north-1": "727897471807",
        "cn-northwest-1": "727897471807",
        "eu-central-1": "763104351884",
        "eu-central-2": "380420809688",
        "eu-north-1": "763104351884",
        "eu-west-1": "763104351884",
        "eu-west-2": "763104351884",
        "eu-west-3": "763104351884",
        "eu-south-1": "692866216735",
        "eu-south-2": "503227376785",
        "me-south-1": "217643126080",
        "me-central-1": "914824155844",
        "sa-east-1": "763104351884",
        "us-east-1": "763104351884",
        "us-east-2": "763104351884",
        "us-gov-east-1": "446045086412",
        "us-gov-west-1": "442386744353",
        "us-iso-east-1": "886529160074",
        "us-isob-east-1": "094389454867",
        "us-west-1": "763104351884",
        "us-west-2": "763104351884"
    }

    public static GetImageUri(region: string): string {
        return `${this.HF_LLM_ACCOUNT[region]}.dkr.ecr.${region}.amazonaws.com/${this.HF_PYTORCH_LLM_TGI_INFERENCE_LATEST}`
    }
}