# --- Secrets (no default; injected as TF_VAR_* by tf.sh from Infisical /infra) ---
variable "oci_tenancy_ocid" {
  type      = string
  sensitive = true
}

variable "oci_user_ocid" {
  type      = string
  sensitive = true
}

variable "oci_fingerprint" {
  type      = string
  sensitive = true
}

variable "oci_private_key" {
  type      = string
  sensitive = true
}

variable "oci_compartment_ocid" {
  type      = string
  sensitive = true
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
}

# --- Bootstrap credential passed into the instance (cloud-init -> Infisical) ---
variable "infisical_client_id" {
  type      = string
  sensitive = true
}

variable "infisical_client_secret" {
  type      = string
  sensitive = true
}

variable "infisical_project_id" {
  type    = string
  default = "INFISICAL_PROJECT_ID"
}

# --- Non-secret knobs ---
variable "oci_region" {
  type    = string
  default = "us-chicago-1"
}

variable "instance_name" {
  type    = string
  default = "ournigeria-prod"
}

variable "instance_ocpus" {
  type    = number
  default = 4
}

variable "instance_memory_gbs" {
  type    = number
  default = 24
}

variable "boot_volume_gbs" {
  type    = number
  default = 50
}

variable "data_volume_gbs" {
  type    = number
  default = 100
}

variable "repo_url" {
  type    = string
  default = "https://github.com/LogicalOgbonna/ournigeria.git"
}

variable "repo_ref" {
  type    = string
  default = "prod"
}

variable "vcn_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}
