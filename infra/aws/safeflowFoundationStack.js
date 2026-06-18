import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  aws_ec2 as ec2,
  aws_kms as kms,
  aws_logs as logs,
  aws_rds as rds,
  aws_s3 as s3,
  aws_secretsmanager as secretsmanager
} from 'aws-cdk-lib';

export class SafeFlowFoundationStack extends Stack {
  constructor(scope, id, props = {}) {
    super(scope, id, props);

    const foundationKey = new kms.Key(this, 'SafeFlowFoundationKey', {
      description: 'Customer managed key for SafeFlow pilot foundation resources',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN
    });
    foundationKey.addAlias('alias/safeflow-foundation');

    const vpc = new ec2.Vpc(this, 'SafeFlowVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'App',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          cidrMask: 24,
          name: 'Data',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    });

    const appSecurityGroup = new ec2.SecurityGroup(this, 'SafeFlowAppSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'SafeFlow application tier security group'
    });

    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'SafeFlowDatabaseSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'SafeFlow PostgreSQL security group'
    });
    databaseSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL only from the SafeFlow application tier'
    );

    const database = new rds.DatabaseInstance(this, 'SafeFlowPostgres', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [databaseSecurityGroup],
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16
      }),
      credentials: rds.Credentials.fromGeneratedSecret('safeflow_admin', {
        encryptionKey: foundationKey
      }),
      databaseName: 'safeflow',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: Duration.days(7),
      deletionProtection: true,
      multiAz: false,
      publiclyAccessible: false,
      storageEncrypted: true,
      storageEncryptionKey: foundationKey,
      removalPolicy: RemovalPolicy.RETAIN
    });
    database.secret?.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const documentBucket = new s3.Bucket(this, 'SafeFlowDocumentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: foundationKey,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const providerConfigSecret = new secretsmanager.Secret(this, 'SafeFlowProviderConfigSecret', {
      secretName: 'safeflow/provider/openai',
      description: 'Server-side provider configuration placeholder for SafeFlow draft generation',
      encryptionKey: foundationKey
    });
    providerConfigSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const apiLogGroup = new logs.LogGroup(this, 'SafeFlowApiLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: foundationKey,
      removalPolicy: RemovalPolicy.RETAIN
    });

    new CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'Private SafeFlow PostgreSQL endpoint'
    });
    new CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn ?? 'unavailable',
      description: 'Generated database credential secret ARN'
    });
    new CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'Encrypted private document/export bucket'
    });
    new CfnOutput(this, 'ProviderConfigSecretArn', {
      value: providerConfigSecret.secretArn,
      description: 'Server-side draft provider configuration secret ARN'
    });
    new CfnOutput(this, 'ApiLogGroupName', {
      value: apiLogGroup.logGroupName,
      description: 'SafeFlow API CloudWatch log group'
    });
  }
}
