# Terraform skeleton - S3 lake bucket + IAM for Flink/Kafka (Proposal §2, IaC)
terraform { required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } } }
variable "bucket_name" { default = "fraudstream-lake" }
resource "aws_s3_bucket" "lake" { bucket = var.bucket_name }
resource "aws_s3_bucket_lifecycle_configuration" "lake" { bucket = aws_s3_bucket.lake.id rule { id = "archive-old" status = "Enabled" transition { days = 90 storage_class = "GLACIER" } } }
