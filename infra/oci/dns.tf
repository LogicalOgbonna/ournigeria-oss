locals {
  api_hosts = {
    api     = "api.ournigeria.ng"
    ingest  = "ingest.ournigeria.ng"
    socials = "socials.ournigeria.ng"
    deploy  = "deploy.ournigeria.ng"
  }
}

resource "cloudflare_dns_record" "api_tier" {
  for_each = local.api_hosts
  zone_id  = var.cloudflare_zone_id
  name     = each.value
  type     = "A"
  content  = oci_core_instance.prod.public_ip
  ttl      = 60
  proxied  = false
}
