import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { SafeFlowFoundationStack, lambdaAssetExcludes } from './safeflowFoundationStack.js';

function synthesizeTemplate() {
  const app = new App();
  const stack = new SafeFlowFoundationStack(app, 'TestSafeFlowFoundationStack');
  return Template.fromStack(stack);
}

describe('SafeFlowFoundationStack', () => {
  it('provisions an encrypted private PostgreSQL database', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      PubliclyAccessible: false,
      StorageEncrypted: true,
      DeletionProtection: true
    });
  });

  it('keeps document storage private, SSL-only and KMS encrypted', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.anyValue(),
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Action: 's3:*',
            Principal: { AWS: '*' }
          })
        ])
      })
    });
  });

  it('creates a customer managed KMS key and server-side secrets', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true
    });
    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
  });

  it('retains secrets when retained database resources are removed from the stack', () => {
    const template = synthesizeTemplate();
    const secrets = Object.values(template.findResources('AWS::SecretsManager::Secret'));

    expect(secrets).toHaveLength(2);
    expect(secrets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          DeletionPolicy: 'Retain',
          UpdateReplacePolicy: 'Retain'
        }),
        expect.objectContaining({
          DeletionPolicy: 'Retain',
          UpdateReplacePolicy: 'Retain'
        })
      ])
    );
  });

  it('restricts database ingress to the application security group on PostgreSQL', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 5432,
      ToPort: 5432,
      SourceSecurityGroupId: Match.anyValue()
    });
  });

  it('provisions private Lambda compute for the SafeFlow API without public ingress', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      KmsKeyArn: Match.anyValue(),
      VpcConfig: Match.objectLike({
        SecurityGroupIds: Match.anyValue(),
        SubnetIds: Match.anyValue()
      }),
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          SAFEFLOW_ENVIRONMENT: 'simulation',
          SAFEFLOW_SIMULATION_ONLY: 'true',
          DATABASE_SECRET_ARN: Match.anyValue(),
          PROVIDER_CONFIG_SECRET_ARN: Match.anyValue(),
          DOCUMENT_BUCKET_NAME: Match.anyValue(),
          MIGRATION_MANIFEST_PATH: 'database/migration-manifest.json'
        })
      })
    });
    template.resourceCountIs('AWS::ApiGateway::RestApi', 0);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 0);
  });

  it('allows the private API function to read secrets and use document storage', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['secretsmanager:GetSecretValue'])
          }),
          Match.objectLike({
            Action: Match.arrayWith(['s3:GetObject', 's3:PutObject'])
          })
        ])
      })
    });
  });

  it('does not grant delete or retention-control permissions on document storage', () => {
    const template = synthesizeTemplate();
    const policies = JSON.stringify(template.findResources('AWS::IAM::Policy'));

    expect(policies).toContain('s3:GetObject');
    expect(policies).toContain('s3:PutObject');
    expect(policies).not.toContain('s3:DeleteObject');
    expect(policies).not.toContain('s3:PutObjectLegalHold');
    expect(policies).not.toContain('s3:PutObjectRetention');
  });

  it('pre-creates the Lambda log group with retention and KMS encryption', () => {
    const template = synthesizeTemplate();
    const functions = template.findResources('AWS::Lambda::Function');
    const [functionLogicalId] = Object.keys(functions);

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/lambda/',
            {
              Ref: functionLogicalId
            }
          ]
        ]
      },
      KmsKeyId: Match.anyValue(),
      RetentionInDays: 30
    });
  });

  it('excludes tests from the deployable Lambda asset', () => {
    expect(lambdaAssetExcludes).toEqual(expect.arrayContaining(['*.test.js', '**/*.test.js']));
  });

  it('adds VPC endpoints for private service access from application subnets', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Interface',
      ServiceName: Match.anyValue(),
      PrivateDnsEnabled: true
    });
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
      ServiceName: Match.anyValue()
    });
  });

  it('does not open interface endpoints to the full VPC CIDR', () => {
    const template = synthesizeTemplate();
    const ingressRules = JSON.stringify(template.findResources('AWS::EC2::SecurityGroupIngress'));

    expect(ingressRules).not.toContain('"CidrIp":"10.0.0.0/16"');
  });
});
