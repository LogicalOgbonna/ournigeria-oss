resource "oci_core_vcn" "main" {
  compartment_id = var.oci_compartment_ocid
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.instance_name}-vcn"
  dns_label      = "ourng"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.instance_name}-igw"
}

resource "oci_core_route_table" "public" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.instance_name}-rt"
  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = var.oci_compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.instance_name}-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 9000
      max = 9000
    }
  }
  ingress_security_rules {
    protocol = "17"
    source   = "0.0.0.0/0"
    udp_options {
      min = 41641
      max = 41641
    }
  }
  # NOTE: no port 22 ingress — SSH reachable only over Tailscale.
}

resource "oci_core_subnet" "public" {
  compartment_id    = var.oci_compartment_ocid
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = var.subnet_cidr
  display_name      = "${var.instance_name}-subnet"
  route_table_id    = oci_core_route_table.public.id
  security_list_ids = [oci_core_security_list.public.id]
  dns_label         = "pub"
}
