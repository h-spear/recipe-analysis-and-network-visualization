import pandas as pd
import requests
import time
import re
from bs4 import BeautifulSoup

result = []
max_main_ingre_length = 0
max_sub_ingre_length = 0
max_seasoning_length = 0


def crawling_recipe_info(num):
    global max_main_ingre_length, max_sub_ingre_length, max_seasoning_length
    url = "https://www.menupan.com/Cook/recipeview.asp?cookid=" + str(num)
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, "html.parser")

        # html 태그 크롤링
        try:
            area_basic = soup.select(
                "body > div > div.right_wrap > div.wrap_info > div.areaBasic"
            )
            selected = soup.select(
                f"body > div > div.right_wrap > div.wrap_food > div > div.infoTable > ul > li"
            )
            name = soup.select_one(
                "body > div > div.right_wrap > div.wrap_top > h2"
            ).get_text()
        except:
            print("crawling_recipe_info error!!!", num)
        main_ingredients = []
        sub_ingredients = []
        seasoning = []

        # 재료 크롤링

        try:
            type = area_basic[0].select_one(".name a").get_text()
            nation = area_basic[0].select_one(".type a").get_text()
            stuff = area_basic[0].select_one(".restTxt a").get_text()
            for tag in selected:
                tmp = []
                title = tag.find("dt").get_text()
                ancher = tag.find("dd")

                seperated = ancher.get_text()
                seperated = re.sub(r"\([^)]*\)", "", seperated)
                seperated = re.sub(r"\[[^]]*\]", "", seperated)
                seperated = seperated.split(",")
                for word in seperated:
                    word = word.split()
                    if len(word) == 1:
                        tmp.append(" ".join(word))
                        continue
                    tmp.append(" ".join(word[0:-1]))

                if title == "주재료":
                    main_ingredients = tmp
                    # ancher tag가 없는 경우
                elif title == "부재료":
                    sub_ingredients = tmp
                elif title == "양념":
                    seasoning = tmp
        except:
            print("crawling_recipe_info error2!!!", num)

        recipe = dict()

        main_ingredients = list(set(main_ingredients))
        sub_ingredients = list(set(sub_ingredients))
        seasoning = list(set(seasoning))

        # dictionary 형태로 저장
        recipe["num"] = num
        recipe["name"] = name
        recipe["type"] = type
        recipe["nation"] = nation
        recipe["stuff"] = stuff
        recipe["main_ingredients"] = main_ingredients
        recipe["sub_ingredients"] = sub_ingredients
        recipe["seasoning"] = seasoning

        # 나중에 엑셀 column을 위해 max_length 계산
        max_main_ingre_length = max(max_main_ingre_length, len(main_ingredients))
        max_sub_ingre_length = max(max_sub_ingre_length, len(sub_ingredients))
        max_seasoning_length = max(max_seasoning_length, len(seasoning))

        # result에 추가
        result.append(recipe)
    else:
        print(response.status_code)


def crawling_recipe(nation, page):
    base_url = "https://www.menupan.com/Cook/RecipeRe.asp?nation="
    url = base_url + str(nation) + "&page=" + str(page)
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, "html.parser")
        # 재료가 적혀있는 ul 선택
        menus = soup.select("body > table:nth-child(2) span > a")
        links = []
        for menu in menus:
            links.append(
                menu["href"].replace("javascript:goRecipeView(", "").replace(")", "")
            )
        for num in links:
            crawling_recipe_info(num)
    else:  # 실패
        print(response.status_code)


def convert_from_dict_to_list():
    global result
    tmp = []
    for dict in result:
        converted = []
        converted.append(dict["num"])
        converted.append(dict["name"])
        converted.append(dict["type"])
        converted.append(dict["nation"])
        converted.append(dict["stuff"])

        for key, length in [
            ("main_ingredients", max_main_ingre_length),
            ("sub_ingredients", max_sub_ingre_length),
            ("seasoning", max_seasoning_length),
        ]:
            i = 0
            for ingre in dict[key]:
                i += 1
                converted.append(ingre)
            while i != length:
                converted.append(" ")
                i += 1

        tmp.append(converted)

    result = tmp
    print("사전 -> 리스트 변환 완료!")


def save_to_excel():
    # 생성할 파일 경로
    file_path = "after_crawling.xlsx"

    # columns로 설정할 리스트
    columns = ["번호", "레시피", "방법", "국가", "종류"]
    for i in range(1, max_main_ingre_length + 1):
        columns.append(f"주재료{i}")
    for i in range(1, max_sub_ingre_length + 1):
        columns.append(f"부재료{i}")
    for i in range(1, max_seasoning_length + 1):
        columns.append(f"양념{i}")

    # crawling한 result로 데이터프레임 만들기
    df = pd.DataFrame(result, columns=columns)
    writer = pd.ExcelWriter(file_path, engine="openpyxl")

    # 엑셀에 저장
    df.to_excel(writer, sheet_name="result", index=False)
    writer.save()
    print(f"엑셀 저장 완료! {file_path}")


def crawling(target):
    work_pages = 0
    for nation, max_pages in target:
        for page in range(1, max_pages + 1):
            work_pages += 1
            crawling_recipe(nation, page)
    print("레시피 크롤링 완료! ", work_pages, "pages, ", len(result), "recipes", sep="")


target = [(10, 49), (20, 29), (30, 7), (40, 5), (50, 2), (60, 6), (80, 8), (90, 17)]
start = time.time()
print("작업 시작!")
crawling(target)
convert_from_dict_to_list()
save_to_excel()
print("작업 시간 : ", time.time() - start, "s", sep="")
