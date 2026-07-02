from reconcile_wards.fetch import is_valid_xlsx


def test_rejects_html_soft_404(tmp_path):
    p = tmp_path / "x.xlsx"
    p.write_bytes(b"<!DOCTYPE html><html>Not Found</html>")
    assert is_valid_xlsx(p) is False


def test_accepts_xlsx_magic(tmp_path):
    p = tmp_path / "x.xlsx"
    p.write_bytes(b"PK\x03\x04" + b"0" * 100)  # zip/xlsx magic
    assert is_valid_xlsx(p) is True
