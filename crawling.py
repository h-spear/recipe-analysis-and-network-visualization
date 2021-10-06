import pandas as pd
import requests
import time
from bs4 import BeautifulSoup
from requests.models import Response


def crawling_recipe_info(num):
    url = "https://www.menupan.com/Cook/recipeview.asp?cookid=862"
    response = requests.get(url)

    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, "html.parser")
        # 재료가 적혀있는 ul 선택
        area_basic = soup.select(
            "body > div > div.right_wrap > div.wrap_info > div.areaBasic"
        )
        type = area_basic[0].select_one(".name a").get_text()
        nation = area_basic[0].select_one(".type a").get_text()
        stuff = area_basic[0].select_one(".restTxt a").get_text()

        print(type, nation, stuff)
    else:  # 실패
        print(response.status_code)


# 불러오기 성공
def crawling_recipe_number(nation, page):
    base_url = "https://www.menupan.com/Cook/RecipeRe.asp?nation="
    url = base_url + str(nation) + "&page=" + str(page)
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        soup = BeautifulSoup(html, "html.parser")
        # 재료가 적혀있는 ul 선택
        menus = soup.select("body > table:nth-child(2) span > a")
        link = []
        for menu in menus:
            link.append(
                menu["href"].replace("javascript:goRecipeView(", "").replace(")", "")
            )
        print(link)
    else:  # 실패
        print(response.status_code)


# crawling_recipe_number(20, 3)
crawling_recipe_info(1)
# start = time.time()
# print("작업한 시간 :", time.time() - start, "s")
