from flask import Flask, request
import json
import MeCab

tagger = MeCab.Tagger("-Oime -l1 -d /usr/local/lib/mecab-skkserv/dic/ipadic")
app = Flask(__name__)

@app.route('/', methods=['POST', 'GET'])
def hello_world():
    dic = json.loads(request.data)
    input = dic["input"]
    tagger.parse(input)

    result, result_set = [], set()
    count = 0
    while (txt := tagger.next()) and count < 20:
        if txt not in result_set:
            result.append(txt)
            result_set.add(txt)
        count += 1
    return json.dumps(result, ensure_ascii=False)

    # return "hello"


# 追加
@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  return response
 

if __name__ == '__main__':
    app.run()

# https://qiita.com/legokichi/items/801e88462eb5c84af97d
# fetch("http://localhost:5000", {method, headers, body}).then((res) => res.text().then((text) => console.log(text)));
