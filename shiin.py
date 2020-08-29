from tqdm import tqdm
if __name__ == '__main__':
    dic = {}
    with open("table") as f:
        for line in f:
            kana, key = line.rstrip().split(" ")
            dic[kana] = key

    tr = str.maketrans(dic)
    with open("dic.utf8.csv", encoding="utf8") as f, open("shiin.utf8.csv", "w", encoding="utf8") as out:
        for line in tqdm(list(f)):
            rows = line.rstrip().split(',')
            if len(rows) != 5:
                continue
            rows[0] = '"' + rows[0].translate(tr) + '"'
            print(','.join(rows), file=out)

