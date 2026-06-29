import {
  ArnFormat,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_kms as kms,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
  aws_logs as logs,
  aws_rds as rds,
  aws_s3 as s3,
  aws_secretsmanager as secretsmanager
} from 'aws-cdk-lib';
import { join } from 'node:path';
import { resolveEnvironmentProfile } from './environmentProfiles.js';

const removalPolicies = Object.freeze({
  destroy: RemovalPolicy.DESTROY,
  retain: RemovalPolicy.RETAIN
});

function resolveRemovalPolicy(policyName) {
  const removalPolicy = removalPolicies[policyName];

  if (!removalPolicy) {
    throw new Error(`Unknown SafeFlow removal policy: ${policyName}`);
  }

  return removalPolicy;
}

export const lambdaAssetExcludes = ['*.test.js', '**/*.test.js'];

export class SafeFlowFoundationStack extends Stack {
  constructor(scope, id, props = {}) {
    super(scope, id, props);

    const profile = props.safeFlowProfile ?? resolveEnvironmentProfile(
      props.safeFlowEnvironment ?? 'simulation',
      { operation: 'synth' }
    );
    const databaseRemovalPolicy = resolveRemovalPolicy(profile.database.removalPolicy);

    const foundationKey = new kms.Key(this, 'SafeFlowFoundationKey', {
      description: 'Customer managed key for SafeFlow pilot foundation resources',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN
    });
    foundationKey.addAlias(`alias/${profile.resourcePrefix}-foundation`);
    foundationKey.addToResourcePolicy(new iam.PolicyStatement({
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:Describe*'
      ],
      conditions: {
        ArnLike: {
          'kms:EncryptionContext:aws:logs:arn': this.formatArn({
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
            service: 'logs',
            resource: 'log-group',
            resourceName: '/aws/lambda/*'
          })
        }
      },
      principals: [new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`)],
      resources: ['*']
    }));

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

    const endpointSecurityGroup = new ec2.SecurityGroup(this, 'SafeFlowEndpointSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'SafeFlow private AWS service endpoint security group'
    });
    endpointSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from the SafeFlow application tier to private service endpoints'
    );

    const databaseSecret = new rds.DatabaseSecret(this, 'SafeFlowDatabaseSecret', {
      username: 'safeflow_admin',
      secretName: `safeflow/${profile.name}/database/admin`,
      encryptionKey: foundationKey
    });
    databaseSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const database = new rds.DatabaseInstance(this, 'SafeFlowPostgres', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [databaseSecurityGroup],
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16
      }),
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'safeflow',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: Duration.days(profile.database.backupRetentionDays),
      copyTagsToSnapshot: true,
      deleteAutomatedBackups: profile.database.deleteAutomatedBackups,
      deletionProtection: profile.database.deletionProtection,
      multiAz: profile.database.multiAz,
      preferredBackupWindow: profile.database.preferredBackupWindow,
      publiclyAccessible: false,
      storageEncrypted: true,
      storageEncryptionKey: foundationKey,
      removalPolicy: databaseRemovalPolicy
    });

    const appDatabaseSecret = new secretsmanager.Secret(this, 'SafeFlowAppDatabaseSecret', {
      secretName: `safeflow/${profile.name}/database/api`,
      description: 'Least-privilege SafeFlow API PostgreSQL credential secret',
      encryptionKey: foundationKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'safeflow_api',
          engine: 'postgres',
          host: database.dbInstanceEndpointAddress,
          port: 5432,
          dbname: 'safeflow'
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true
      }
    });
    appDatabaseSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const documentBucket = new s3.Bucket(this, 'SafeFlowDocumentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: foundationKey,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const providerConfigSecret = new secretsmanager.Secret(this, 'SafeFlowProviderConfigSecret', {
      secretName: `safeflow/${profile.name}/provider/openai`,
      description: 'Server-side provider configuration placeholder for SafeFlow draft generation',
      encryptionKey: foundationKey
    });
    providerConfigSecret.applyRemovalPolicy(RemovalPolicy.RETAIN);

    vpc.addInterfaceEndpoint('SafeFlowSecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
      open: false,
      securityGroups: [endpointSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });
    vpc.addGatewayEndpoint('SafeFlowS3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    });

    const databaseLambdaBundling = {
      bundleAwsSDK: true,
      target: 'node22',
      commandHooks: {
        beforeBundling() {
          return [];
        },
        beforeInstall() {
          return [];
        },
        afterBundling(inputDir, outputDir) {
          return [
            `node "${join(inputDir, 'infra/aws/copyMigratorAssets.mjs')}" "${inputDir}" "${outputDir}"`
          ];
        }
      }
    };

    const apiFunction = new nodejs.NodejsFunction(this, 'SafeFlowApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      entry: join(process.cwd(), 'infra/aws/lambda/safeflowApi/index.mjs'),
      handler: 'handler',
      description: 'Private SafeFlow simulation API compute scaffold',
      memorySize: 512,
      timeout: Duration.seconds(10),
      environmentEncryption: foundationKey,
      environment: {
        SAFEFLOW_ENVIRONMENT: profile.name,
        SAFEFLOW_SIMULATION_ONLY: String(profile.simulationOnly),
        SAFEFLOW_DATA_CLASSIFICATION: profile.dataClassification,
        SAFEFLOW_DATA_MODE: 'database',
        DATABASE_SECRET_ARN: appDatabaseSecret.secretArn,
        PROVIDER_CONFIG_SECRET_ARN: providerConfigSecret.secretArn,
        DOCUMENT_BUCKET_NAME: documentBucket.bucketName,
        MIGRATION_MANIFEST_PATH: 'database/migration-manifest.json'
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [appSecurityGroup],
      projectRoot: process.cwd(),
      depsLockFilePath: join(process.cwd(), 'package-lock.json'),
      bundling: databaseLambdaBundling
    });
    appDatabaseSecret.grantRead(apiFunction);
    providerConfigSecret.grantRead(apiFunction);
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:AbortMultipartUpload'],
      resources: [documentBucket.arnForObjects('simulation/*')]
    }));
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [documentBucket.bucketArn],
      conditions: {
        StringLike: {
          's3:prefix': ['simulation/*']
        }
      }
    }));
    foundationKey.grantEncryptDecrypt(apiFunction);

    const migrationFunction = new nodejs.NodejsFunction(this, 'SafeFlowMigrationFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      entry: join(process.cwd(), 'infra/aws/lambda/safeflowMigrator/index.mjs'),
      handler: 'handler',
      description: 'Private SafeFlow simulation database migration runner',
      memorySize: 512,
      timeout: Duration.seconds(120),
      environmentEncryption: foundationKey,
      environment: {
        SAFEFLOW_ENVIRONMENT: profile.name,
        SAFEFLOW_SIMULATION_ONLY: String(profile.simulationOnly),
        SAFEFLOW_DATA_CLASSIFICATION: profile.dataClassification,
        DATABASE_SECRET_ARN: database.secret?.secretArn ?? 'unavailable',
        APP_DATABASE_SECRET_ARN: appDatabaseSecret.secretArn
      },
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [appSecurityGroup],
      projectRoot: process.cwd(),
      depsLockFilePath: join(process.cwd(), 'package-lock.json'),
      bundling: databaseLambdaBundling
    });
    databaseSecret.grantRead(migrationFunction);
    appDatabaseSecret.grantRead(migrationFunction);
    foundationKey.grantEncryptDecrypt(migrationFunction);

    const apiLogGroup = new logs.LogGroup(this, 'SafeFlowApiLogGroup', {
      logGroupName: `/aws/lambda/${apiFunction.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: foundationKey,
      removalPolicy: RemovalPolicy.RETAIN
    });

    new CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'Private SafeFlow PostgreSQL endpoint'
    });
    new CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseSecret.secretArn,
      description: 'Generated database credential secret ARN'
    });
    new CfnOutput(this, 'AppDatabaseSecretArn', {
      value: appDatabaseSecret.secretArn,
      description: 'Least-privilege SafeFlow API database credential secret ARN'
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
    new CfnOutput(this, 'ApiFunctionName', {
      value: apiFunction.functionName,
      description: 'Private SafeFlow API Lambda function name'
    });
    new CfnOutput(this, 'MigrationFunctionName', {
      value: migrationFunction.functionName,
      description: 'Private SafeFlow migration runner Lambda function name'
    });
  }
}
