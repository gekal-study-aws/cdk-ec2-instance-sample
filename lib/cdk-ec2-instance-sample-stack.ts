import { Stack, StackProps, RemovalPolicy, CfnOutput, Token } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { readFileSync } from 'fs';

export class CdkEc2InstanceSampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC作成
    const vpc = new ec2.Vpc(this, 'vpc', {
      cidr: '10.10.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
    });

    // キーペア作成
    const cfnKeyPair = new ec2.CfnKeyPair(this, 'test-key-pair', {
      keyName: 'test-key-pair',
    });
    cfnKeyPair.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // キーペア取得コマンドアウトプット
    new CfnOutput(this, 'GetSSHKeyCommand', {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnKeyPair.getAtt('KeyPairId')} --region ${this.region} --with-decryption --query Parameter.Value --output text > ~/.ssh/gekal.ppk`,
    });

    const role = new iam.Role(this, 'ec2-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEc2RoleforSSM')],
      inlinePolicies: {
        ec2: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2-instance-connect:SendSerialConsoleSSHPublicKey'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    const ec2Sg = new ec2.SecurityGroup(this, "ec2-sg", {
      vpc: vpc
    });
    ec2Sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow http access from anywhere'
    )

    // EC2作成
    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      role: role,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(10, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          })
        },
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          })
        }
      ],
      securityGroup: ec2Sg,
      keyName: Token.asString(cfnKeyPair.ref),
    })
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22));

    // ユーザーデータにてApacheサーバーをインストール
    const userData = readFileSync('./lib/user-dta.sh', 'utf8');
    instance.addUserData(userData);
  }
}
