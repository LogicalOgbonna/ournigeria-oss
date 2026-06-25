output "public_ip" {
  value = oci_core_instance.prod.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@ournigeria-prod  # over Tailscale (no public 22)"
}

output "hostnames" {
  value = [for h in local.api_hosts : h]
}
