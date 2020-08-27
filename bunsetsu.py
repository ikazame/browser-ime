import MeCab
import copy

if __name__ == '__main__':
    tagger = MeCab.Tagger("-Oime -l1 -d /usr/local/lib/mecab-skkserv/dic/ipadic")
    # print(m.parseNBest(10, "たろうはとうきょうにいく"))
    print(tagger.parse("ここではきものをぬいでください"))

    # sent = "りんご"
    sent = "ここではきものをぬいでください"
    # sent = "とうきょう"
    lattice = MeCab.Lattice()
    lattice.set_sentence(sent)

    tagger.parse(lattice)
    # print(lattice.toString())

    print(lattice.size())
    node = lattice.bos_node()
    while node:
        print(node.surface, node.feature, node.length)
        node = node.next

    node = lattice.bos_node().next
    i = 0
    while node.stat != MeCab.MECAB_EOS_NODE:
        lattice.set_boundary_constraint(i, MeCab.MECAB_TOKEN_BOUNDARY)
        i += 1
        for j in range(node.length-1):
            lattice.set_boundary_constraint(i, MeCab.MECAB_INSIDE_TOKEN)
            i += 1
        node = node.next

    lattice.add_request_type(MeCab.MECAB_NBEST)
    tagger.parse(lattice)


    pos = 0
    while True:
        node = lattice.begin_nodes(pos)
        if node.stat == MeCab.MECAB_EOS_NODE:
            break
        pos += node.length
        while node:
            print(node.feature, node.wcost)
            node = node.bnext

'''
mozc論文の「3.3 N-best の提示」が何書いてあるか最初わからなかったが、実装してみたら分かった。
ラティスで作れるN-Bestを全部出したら指数関数的に答えが増加してしまう、各文節のベストとは何かを考える方法だった。

最適解制約
太郎は, "つ"に, 行く
"つ"の変換候補は、左右の文節、太郎はと行くを固定した際の、ランキングで提示される

制約なし
太郎は, "つ"に, 行く
"つ"の変換候補は、つの変換確率（多分事前計算した生起確率）でランキングされる

周辺化, 疑似周辺化
forward, backwardアルゴリズムがわからないのでわかりません
'''