data "oci_identity_availability_domains" "ads" {
  compartment_id = var.oci_tenancy_ocid
}

data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.oci_compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "prod" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.oci_compartment_ocid
  display_name        = var.instance_name
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gbs
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloudinit.sh.tftpl", {
      infisical_client_id     = var.infisical_client_id
      infisical_client_secret = var.infisical_client_secret
      infisical_project_id    = var.infisical_project_id
      repo_url                = var.repo_url
      repo_ref                = var.repo_ref
    }))
  }
}

resource "oci_core_volume" "pgdata" {
  compartment_id      = var.oci_compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${var.instance_name}-pgdata"
  size_in_gbs         = var.data_volume_gbs
}

resource "oci_core_volume_attachment" "pgdata" {
  attachment_type = "paravirtualized"
  instance_id     = oci_core_instance.prod.id
  volume_id       = oci_core_volume.pgdata.id
  device          = "/dev/oracleoci/oraclevdb"
}
