import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';
import * as cognito from '@aws-cdk/aws-cognito';

const schemaAttributePreferredUsername: cognito.CfnUserPool.SchemaAttributeProperty = {
    attributeDataType: 'String',
    mutable: true,
    name: 'preferred_username',
    required: true,
    stringAttributeConstraints: {
        maxLength: '256',
        minLength: '1',
    },
};

export function override(resources: AmplifyAuthCognitoStackTemplate) {
}
