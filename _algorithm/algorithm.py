import pandas as pd
import math

Location = 'C:/Users/DCT/Desktop/대학교/3-2/소프트웨어 응용/SWGit/SWTeamProject'
File = 'after_crawling.xlsx'

data_pd = pd.read_excel('{}/{}'.format(Location, File),
                        header=None, index_col=None, names=None)

nodes = []
for i in range(1, 1670):
    node = dict()
    node["번호"] = data_pd[0][i]
    node["레시피"] = data_pd[1][i]
    node["방법"] = data_pd[2][i]
    node["국가"] = data_pd[3][i]
    node["종류"] = data_pd[4][i]
    node["주재료"] = set()
    for j in range(5,17):
        if data_pd[j][i] != ' ':
            node["주재료"].add(data_pd[j][i])

    node["부재료"] = set()
    for j in range(17, 35):
        if data_pd[j][i] != ' ':
            node["부재료"].add(data_pd[j][i])

    node["양념"] = set()
    for j in range(35, 57):
        if data_pd[j][i] != ' ':
            node["양념"].add(data_pd[j][i])
    nodes.append(node)

graph = []
edge_cnt = 0
for i in range(0,len(nodes)):
    for j in range(0, len(nodes)):
        if nodes[i]["레시피"] == nodes[j]["레시피"]:
            continue
        node1 = nodes[i]
        size1 = len(nodes[i]["주재료"]) + len(nodes[i]["부재료"]) + len(nodes[i]["양념"])
        node2 = nodes[j]
        size2 = len(nodes[j]["주재료"]) + len(nodes[j]["부재료"]) + len(nodes[j]["양념"])

        weight = 0

        if len(node1["주재료"] | node2["주재료"]) != 0:
            ratio = len(node1["주재료"] & node2["주재료"]) / len(node1["주재료"] | node2["주재료"])
            weight += math.exp(ratio)

        if len(node1["부재료"] | node2["부재료"]) != 0:
            ratio = len(node1["부재료"] & node2["부재료"]) / len(node1["부재료"] | node2["부재료"])
            weight += ratio

        if len(node1["양념"] | node2["양념"]) != 0:
            ratio = len(node1["양념"] & node2["양념"]) / len(node1["양념"] | node2["양념"])
            weight += ratio / 2


        if weight > 1.5:
            if size1 > size2:
                graph.append([node1["레시피"], node2["레시피"], weight])
            else:
                graph.append([node2["레시피"], node1["레시피"], weight])
            edge_cnt += 1

print(edge_cnt)

# 생성할 파일 경로
file_path = "edge_info.xlsx"
columns = ["Source", "Target", "Weight"]
# columns로 설정할 리스트
df = pd.DataFrame(graph, columns=columns)
writer = pd.ExcelWriter(file_path, engine="openpyxl")
df.to_excel(writer, sheet_name="result", index=False)
writer.save()
print(f"엑셀 저장 완료! {file_path}")