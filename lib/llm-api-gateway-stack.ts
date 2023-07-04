import * as cdk from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import manifestJson from '../helper/manifest.json';
import {Manifest} from '../helper/manifest'
import {Cors} from "aws-cdk-lib/aws-apigateway";

interface LlmApiGatewayStackProps extends cdk.StackProps {
    modelId: string
    projectPrefix: string
    instanceType: string,
    instanceCount: number,
    requireApiKey: boolean
}

export class LLMAPIGatewayStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LlmApiGatewayStackProps) {
        super(scope, id, props);
        const manifest = manifestJson as Manifest
        const region = Stack.of(this).region
        const modelInfo = manifest[region][props.modelId]

        const smExecRole = new iam.Role(this, 'sagemaker-execution-role', {
            assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess')]
        })

        const model = new sagemaker.CfnModel(this, 'model', {
            modelName: `${props.projectPrefix}-${modelInfo.model_id}`,
            executionRoleArn: smExecRole.roleArn,
            primaryContainer: {
                image: modelInfo.model_image,
                modelDataUrl: `s3://${modelInfo.model_bucket}/${modelInfo.model_data_uri}`,
                environment: modelInfo.env_variables
            }
        })

        const endpointConfig = new sagemaker.CfnEndpointConfig(this, 'endpoint-config', {
            productionVariants: [{
                modelName: model.getAtt('ModelName').toString(),
                instanceType: props.instanceType,
                initialInstanceCount: props.instanceCount,
                initialVariantWeight: 1,
                variantName: "AllTraffic"
            }]
        })

        endpointConfig.addDependency(model);

        const endpoint = new sagemaker.CfnEndpoint(this, 'endpoint', {
            endpointConfigName: endpointConfig.getAtt("EndpointConfigName").toString(),
            endpointName: `${props.projectPrefix}-${modelInfo.model_id}`
        })

        endpoint.addDependency(endpointConfig);

        const apiGatewayIamRole = new iam.Role(this, 'api-role', {
            assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
        });
        apiGatewayIamRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: [endpoint.ref],
            actions: ['sagemaker:InvokeEndpoint']
        }));
        const api = new apigateway.RestApi(this, 'api-gateway', {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS
            },
            restApiName: `${props.projectPrefix} API`

        });
        api.root.addMethod('POST',new apigateway.AwsIntegration({
            path: `endpoints/${endpoint.endpointName}/invocations`,
            region: region,
            integrationHttpMethod: 'POST',
            service: 'runtime.sagemaker',
            options: {
                credentialsRole: apiGatewayIamRole,
                integrationResponses: [
                    {
                        statusCode: "200"
                    }
                ]
            }
        }), {
            apiKeyRequired: props.requireApiKey,
            methodResponses: [{
                statusCode: "200",
                responseModels: {
                    "application/json": apigateway.Model.fromModelName(this, id, "Empty")
                }
            }]
        })


        // this.node.addValidation({
        //     validate: () => {
        //         const messages: string[] = []
        //         const modelManifest = manifest[region][props.modelId]
        //         if (modelManifest === undefined) messages.push("Model ID is invalid")
        //         return messages;
        //     }
        // })


        // new CfnOutput(this, 'ModelUri', {value: value.model_data_uri});
    }
}
