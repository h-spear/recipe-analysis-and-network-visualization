import pandas as pd
import requests
from bs4 import BeautifulSoup

recipe_base_url = "https://www.10000recipe.com"
page_base_url = "https://www.10000recipe.com/profile/recipe.html?uid=gdubu33&page="
path = "C:/Users/hspear/Desktop/Folder/3-2/SW_Application/project/test.xlsx"

result = []
max_ingre_length = 0


def extract_ingredients(recipe_url):
    global max_ingre_length
    url = recipe_base_url + recipe_url
    response = requests.get(url)

    # 불러오기 성공
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, "html.parser")

        # 재료가 적혀있는 ul 선택
        name = soup.select_one("#contents_area > div.view2_summary.st3 > h3")

        if name == None:
            print("이름", recipe_url)
            return

        ingredients_container = soup.select_one("#divConfirmedMaterialArea > ul")

        if ingredients_container == None:
            print("컨테이너", recipe_url)
            return

        ingredients = ingredients_container.select("li")

        if ingredients == None:
            print("재료", recipe_url)
            return

        ingre_list = [name.get_text()]
        for ingredient in ingredients:
            ingredient.span.decompose()
            ingre_list.append(ingredient.get_text().replace(" ", "").replace("\n", ""))
        max_ingre_length = max(max_ingre_length, len(ingre_list) - 1)
        result.append(ingre_list)
    else:  # 실패
        print(response.status_code)


def crawling(max_pages):
    for page in range(1, max_pages + 1):
        url = page_base_url + str(page)
        response = requests.get(url)
        if response.status_code == 200:
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            cont_list = soup.select_one("#contents_area > div.brand_cont.mag_t_10 > ul")
            recipes = cont_list.select("li")
            for recipe in recipes:
                url = recipe.find("a")["href"]
                extract_ingredients(url)
        else:
            print(response.status_code)
    print(f"크롤링 완료! {max_pages}pages")


def save_to_excel():
    # columns로 설정할 리스트
    columns = ["레시피"]
    file_path = "after_crawling.xlsx"
    for i in range(1, max_ingre_length + 1):
        columns.append(f"재료{i}")

    # crawling한 result로 데이터프레임 만들기
    df = pd.DataFrame(result, columns=columns)
    writer = pd.ExcelWriter(file_path, engine="openpyxl")

    # 엑셀에 저장
    df.to_excel(writer, sheet_name="result", index=False)
    writer.save()
    print(f"엑셀 저장 완료! {file_path}")


crawling(210)
save_to_excel()
