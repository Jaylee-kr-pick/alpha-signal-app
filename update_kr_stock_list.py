# update_kr_stock_list.py
import urllib.request, ssl, zipfile, os, pandas as pd

def download_and_extract(url, zip_path, extract_to):
    ssl._create_default_https_context = ssl._create_unverified_context
    urllib.request.urlretrieve(url, zip_path)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    os.remove(zip_path)

def parse_mst_file(path):
    rows = []
    with open(path, "r", encoding="cp949") as f:
        for row in f:
            short_code = row[0:9].strip()
            standard_code = row[9:21].strip()
            name = row[21:71].strip()
            rows.append({
                "code": short_code,
                "standardCode": standard_code,
                "name": name
            })
    return rows

def save_to_public_data(kospi_data, kosdaq_data, output_path):
    df = pd.DataFrame(kospi_data + kosdaq_data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, encoding='utf-8-sig')

if __name__ == "__main__":
    base_dir = os.getcwd()
    public_data_path = os.path.join(base_dir, "public", "data", "kr_stocks.csv")

    download_and_extract(
        "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip",
        os.path.join(base_dir, "kospi.zip"), base_dir
    )
    download_and_extract(
        "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip",
        os.path.join(base_dir, "kosdaq.zip"), base_dir
    )

    kospi = parse_mst_file(os.path.join(base_dir, "kospi_code.mst"))
    kosdaq = parse_mst_file(os.path.join(base_dir, "kosdaq_code.mst"))
    save_to_public_data(kospi, kosdaq, public_data_path)

    print(f"✅ 완료: 종목 리스트가 {public_data_path} 에 저장되었습니다.")