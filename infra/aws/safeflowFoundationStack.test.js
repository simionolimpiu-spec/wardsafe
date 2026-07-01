import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { resolveEnvironmentProfile } from './environmentProfiles.js';
import { SafeFlowFoundationStack, lambdaAssetExcludes } from './safeflowFoundationStack.js';

function synthesizeTemplate(profileName = 'simulation') {
  const app = new App();
  const stack = new SafeFlowFoundationStack(app, 'TestSafeFlowFoundationStack', {
    safeFlowProfile: resolveEnvironmentProfile(profileName, {
      operation: 'synth',
      allowRestricted: true
    }),
    env: {
      account: '123456789012',
      region: 'eu-west-2'
    }
  });
  return Template.fromStack(stack);
}

describe('SafeFlowFoundationStack', () => {
  it('provisions an encrypted private PostgreSQL database', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      PubliclyAccessible: false,
      StorageEncrypted: true,
      DeletionProtection: false
    });
  });

  it('applies Free-plan compatible cleanup controls for simulation', () => {
    const template = synthesizeTemplate();

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 1,
      CopyTagsToSnapshot: true,
      DeleteAutomatedBackups: true,
      DeletionProtection: false,
      PreferredBackupWindow: '02:00-03:00'
    });
    const resources = Object.values(template.findResources('AWS::RDS::DBInstance'));
    expect(resources).toHaveLength(1);
    expect(resources[0].DeletionPolicy).not.toBe('Retain');
    expect(resources[0].UpdateReplacePolicy).not.toBe('Retain');
  });

  it('applies the selected dev profile to database and Lambda configuration', () => {
    const template = synthesizeTemplate('dev');

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 1,
      DeleteAutomatedBackups: true,
      PreferredBackupWindow: '01:00-02:00'
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          SAFEFLOW_ENVIRONMENT: 'dev',
          SAFEFLOW_SIMULATION_ONLY: 'true',
          SAFEFLOW_DATA_CLASSIFICATION: 'synthetic-only'
        })
      })
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
    template.resourceCountIs('AWS::SecretsManager::Secret', 3);
  });

  it('retains secrets when retained database resources are removed from the stack', () => {
    const template = synthesizeTemplate();
    const secrets = Object.values(template.findResources('AWS::SecretsManager::Secret'));

    expect(secrets).toHaveLength(3);
    for (const secret of secrets) {
      expect(secret.DeletionPolicy).toBe('Retain');
      expect(secret.UpdateReplacePolicy).toBe('Retain');
    }
  });

  it('namespaces KMS aliases and secret names by environment', () => {
    const simulation = synthesizeTemplate('simulation');
    const dev = synthesizeTemplate('dev');

    simulation.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/safeflow-simulation-foundation'
    });
    simulation.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'safeflow/simulation/database/admin'
    });
    simulation.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'safeflow/simulation/database/api'
    });
    simulation.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'safeflow/simulation/provider/openai'
    });
    dev.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/safeflow-dev-foundation'
    });
    dev.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'safeflow/dev/database/admin'
    });
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
          SAFEFLOW_DATA_MODE: 'database',
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

  it('provisions a private migration runner Lambda for approved simulation database bootstrap', () => {
    const template = synthesizeTemplate();

    template.resourceCountIs('AWS::Lambda::Function', 2);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
      Description: 'Private SafeFlow simulation database migration runner',
      Timeout: 120,
      VpcConfig: Match.objectLike({
        SecurityGroupIds: Match.anyValue(),
        SubnetIds: Match.anyValue()
      }),
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          SAFEFLOW_ENVIRONMENT: 'simulation',
          SAFEFLOW_SIMULATION_ONLY: 'true',
          SAFEFLOW_DATA_CLASSIFICATION: 'synthetic-only',
          DATABASE_SECRET_ARN: Match.anyValue(),
          APP_DATABASE_SECRET_ARN: Match.anyValue()
        })
      })
    });
    template.hasOutput('MigrationFunctionName', {
      Description: 'Private SafeFlow migration runner Lambda function name'
    });
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

  it('keeps the admin database secret migration-only and gives the API an app database secret', () => {
    const template = synthesizeTemplate();
    const resources = template.findResources('AWS::Lambda::Function');
    const apiFunction = Object.values(resources).find((resource) => (
      resource.Properties.Description === 'Private SafeFlow simulation API compute scaffold'
    ));
    const migrationFunction = Object.values(resources).find((resource) => (
      resource.Properties.Description === 'Private SafeFlow simulation database migration runner'
    ));

    expect(apiFunction.Properties.Environment.Variables.DATABASE_SECRET_ARN).toEqual({
      Ref: expect.stringMatching(/SafeFlowAppDatabaseSecret/)
    });
    expect(migrationFunction.Properties.Environment.Variables.DATABASE_SECRET_ARN).toEqual({
      Ref: expect.stringMatching(/SafeFlowDatabaseSecret/)
    });
    expect(migrationFunction.Properties.Environment.Variables.APP_DATABASE_SECRET_ARN).toEqual({
      Ref: expect.stringMatching(/SafeFlowAppDatabaseSecret/)
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

  it('allows CloudWatch Logs to use the foundation KMS key for Lambda log encryption', () => {
    const template = synthesizeTemplate();
    const keyPolicyText = JSON.stringify(template.findResources('AWS::KMS::Key'));

    template.hasResourceProperties('AWS::KMS::Key', {
      KeyPolicy: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'logs.eu-west-2.amazonaws.com'
            },
            Action: Match.arrayWith([
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:GenerateDataKey*'
            ]),
            Condition: Match.objectLike({
              ArnLike: Match.anyValue()
            })
          })
        ])
      })
    });
    expect(keyPolicyText).toContain('log-group:/aws/lambda/');
    expect(keyPolicyText).not.toContain('log-group//aws/lambda/');
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
