#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LLMAPIGatewayStack } from '../lib/llm-api-gateway-stack';
import {Models} from '../helper/manifest'
const app = new cdk.App();

new LLMAPIGatewayStack(app, 'CdkLlmApiGatewayStack', {
    modelId: Models.Falcon7bInstruct,
    projectPrefix: 'myproject',
    instanceCount: 1,
    instanceType: 'ml.g5.2xlarge',
    requireApiKey: true,
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});