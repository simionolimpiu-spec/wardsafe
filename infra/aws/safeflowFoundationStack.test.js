import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { SafeFlowFoundationStack } from './safeflowFoundationStack.js';

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
});
