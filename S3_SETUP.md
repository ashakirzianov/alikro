# S3 Bucket Setup for Alikro Asset Uploads

This document provides instructions on setting up an Amazon S3 bucket for uploading assets in the Alikro website.

## 1. Create an AWS Account

If you don't already have an AWS account:

1. Go to [AWS Sign Up](https://portal.aws.amazon.com/billing/signup)
2. Follow the on-screen instructions to create a new AWS account
3. Once your account is set up, sign in to the AWS Management Console

## 2. Create the S3 Bucket

1. Navigate to the S3 service in the AWS Management Console
2. Click "Create bucket"
3. Enter the bucket name: `alikro-assets`
4. Select the AWS Region closest to your users for better performance
5. Configure bucket settings:
   - Block all public access: Enabled (recommended for security)
   - Bucket versioning: Optional, but recommended
   - Server-side encryption: Enabled (recommended)
6. Click "Create bucket"

## 3. Configure CORS (Cross-Origin Resource Sharing)

To allow uploads from your website:

1. Select the newly created `alikro-assets` bucket
2. Go to "Permissions" tab
3. Scroll down to "Cross-origin resource sharing (CORS)"
4. Click "Edit" and add the following configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://alikro.art", "http://localhost:3000", "https://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## 4. Create IAM User for Programmatic Access

1. Navigate to the IAM service in AWS Management Console
2. Click "Users" → "Add user"
3. Enter a user name (e.g., `alikro-assets`)
4. Select "Access key - Programmatic access"
5. Click "Next: Permissions"
6. Create a new group with the following policy (or attach an inline policy to the user):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::alikro-assets",
        "arn:aws:s3:::alikro-assets/*"
      ]
    }
  ]
}
```

7. Complete the user creation process
8. **IMPORTANT**: On the final page, you'll see the Access Key ID and Secret Access Key. Download the CSV file or make a note of these credentials as they will be shown only once.

## 5. Configuration and Environment Variables

The application uses a combination of environment variables and configuration constants for S3 setup.

### Required Environment Variables

**Only these need to be set in your environment:**

```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

For local development, add environment variables to a `.env.local` file in your project root.

For production, add the environment variables to your hosting platform's environment configuration.

## 6. Security Considerations

- Never commit your AWS credentials to Git
- Consider using temporary credentials via AWS STS for production
- Regularly rotate your access keys
- Set up bucket policies to restrict access as needed
- Enable CloudTrail logging to track S3 operations

## 7. Setting Up a CDN (Optional but Recommended)

For better performance and caching:

1. Create an Amazon CloudFront distribution
2. Set your S3 bucket as the origin
3. Configure the appropriate cache behaviors
4. Update the `NEXT_PUBLIC_ASSETS_DOMAIN` to your CloudFront domain

## 8. Cost Management

- S3 charges for storage, requests, and data transfer
- Monitor your usage to avoid unexpected charges
- Consider setting up AWS Budget Alerts
- For small projects, you might qualify for the AWS Free Tier

## Additional Resources

- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)